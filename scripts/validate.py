#!/usr/bin/env python3
"""Validate cross-references within holonovel.md."""

import re
import sys
from pathlib import Path

SPEC = Path(__file__).resolve().parent.parent / "holonovel.md"


def read_spec():
    if not SPEC.exists():
        print(f"ERROR: {SPEC} not found")
        sys.exit(1)
    return SPEC.read_text()


def strip_markdown_formatting(raw):
    """Strip inline formatting: code, bold, italic, links. Preserve underscores."""
    s = raw
    s = re.sub(r"`([^`]+)`", r"\1", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)
    s = re.sub(r"\*([^*]+)\*", r"\1", s)
    s = re.sub(r"__([^_]+)__", r"\1", s)
    s = re.sub(r"_([^_]+)_", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    return s.strip()


def extract_req_index(text):
    """Extract REQ-NNN -> Title from Appendix E's manifest table."""
    reqs = {}
    in_table = False
    for line in text.splitlines():
        if line.strip().startswith("| REQ     | Title"):
            in_table = True
            continue
        if in_table:
            if line.strip().startswith("| -------"):
                continue
            m = re.match(r"\|\s*(REQ-\d{3})\s*\|\s*(.+?)\s*\|", line)
            if m:
                reqs[m.group(1)] = m.group(2).strip()
            elif not line.strip().startswith("|"):
                break
    return reqs


def extract_test_ids(text):
    """Extract test IDs (T3, T18, ...) from Section 7's derived test table."""
    tests = set()
    in_table = False
    for line in text.splitlines():
        if line.strip().startswith("| #   | Test"):
            in_table = True
            continue
        if in_table:
            if line.strip().startswith("| ---"):
                continue
            m = re.match(r"\|\s*((?:T\d+)(?:\s*,\s*(?:T\d+))*)\s*\|", line)
            if m:
                for tid in re.findall(r"T\d+", m.group(1)):
                    tests.add(tid)
            elif not line.strip().startswith("| T"):
                break
    return tests


def extract_headings(text):
    """Extract headings, skipping content inside code blocks."""
    headings = []
    in_block = False
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_block = not in_block
            continue
        if in_block:
            continue
        m = re.match(r"^(#{1,4})\s+(.+)", line)
        if m:
            level = len(m.group(1))
            title = strip_markdown_formatting(m.group(2))
            headings.append((level, title))
    return headings


def extract_toc_entries(text):
    """Extract TOC entries from the Contents section."""
    entries = []
    in_toc = False
    for line in text.splitlines():
        if line.strip() == "## Contents":
            in_toc = True
            continue
        if in_toc:
            if line.strip().startswith("##") and not line.strip().startswith("###"):
                break
            m = re.match(r"^\s*-\s*\[(.+?)\]\(", line)
            if m:
                entries.append(strip_markdown_formatting(m.group(1)))
    return entries


def find_req_citations(text):
    """Find all REQ-NNN citations outside of Appendix E."""
    appendix_e_start = text.find("## Appendix E:")
    before_apx = text[:appendix_e_start] if appendix_e_start != -1 else text
    after_apx = text[appendix_e_start:] if appendix_e_start != -1 else ""
    manifest_start = after_apx.find("| REQ     | Title")
    if manifest_start != -1:
        manifest_end = after_apx.find("\n\n", manifest_start)
        if manifest_end != -1:
            after_apx = after_apx[manifest_end:]
    return set(re.findall(r"\b(REQ-\d{3})\b", before_apx + after_apx))


def find_test_citations(text):
    """Find all T<num> citations outside of Section 7's test table."""
    sec7_start = text.find("## 7. Verification Gates")
    sec8_start = text.find("## 8.")
    if sec7_start != -1 and sec8_start != -1:
        before = text[:sec7_start]
        after = text[sec8_start:]
        combined = before + after
    else:
        combined = text
    return set(re.findall(r"\b(T\d+)\b", combined))


def check_req_blocks(text):
    """Check that requirement blocks follow the canonical shape."""
    issues = []
    blocks = re.finditer(
        r"\*\*(REQ-\d{3}\s+—\s+.+?)\.\*\*", text
    )
    for m in blocks:
        req_id = m.group(1).split()[0]
        body_start = m.end()
        rest = text[body_start:]
        end_match = re.search(r"\*\*REQ-\d{3}\s+—|^#{1,4}\s+", rest, re.MULTILINE)
        body = rest[:end_match.start()] if end_match else rest
        if "*Check:*" not in body and "_Check:_" not in body:
            issues.append(f"{req_id}: missing Check: trailer")
    return issues


def check_separators(text):
    """Check that top-level sections are separated by horizontal rules.
    Skips the Contents heading and all headings under # Appendices."""
    issues = []
    in_block = False
    past_appendices = False
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith("```"):
            in_block = not in_block
            continue
        if in_block:
            continue
        if re.match(r"^#\s+Appendices", line):
            past_appendices = True
            continue
        if past_appendices:
            continue
        if re.match(r"^#{2}\s+Contents", line):
            continue
        if re.match(r"^#{1,4}\s+", line) and i > 0:
            prev = i - 1
            while prev >= 0 and not lines[prev].strip():
                prev -= 1
            if prev >= 0 and lines[prev].strip() != "---":
                if line.startswith("## "):
                    issues.append(
                        f"Line {i+1}: heading '{line.strip()}' not preceded by ---"
                    )
    return issues


def main():
    text = read_spec()
    errors = 0
    warnings = 0

    # 1. REQ cross-references
    req_index = extract_req_index(text)
    cited_reqs = find_req_citations(text)
    undefined_reqs = cited_reqs - set(req_index.keys())
    uncited_reqs = set(req_index.keys()) - cited_reqs
    if undefined_reqs:
        for r in sorted(undefined_reqs):
            print(f"ERROR: {r} cited but not defined in Appendix E")
        errors += len(undefined_reqs)
    if uncited_reqs:
        for r in sorted(uncited_reqs):
            print(f"WARNING: {r} defined in Appendix E but never cited")
        warnings += len(uncited_reqs)
    if not undefined_reqs and not uncited_reqs:
        print("PASS: All REQ citations resolve; all defined REQs are cited")

    # 1b. REQ count — report the actual count from the manifest table.
    # The Appendix E header no longer hardcodes a count (it drifts); the validator
    # computes it from the table rows.
    actual = len(req_index)
    print(f"PASS: Appendix E manifest contains {actual} REQ rows")

    # 2. Test ID cross-references
    test_ids = extract_test_ids(text)
    cited_tests = find_test_citations(text)
    undefined_tests = cited_tests - test_ids
    uncited_tests = test_ids - cited_tests
    if undefined_tests:
        for t in sorted(undefined_tests):
            print(f"ERROR: {t} cited but not in Section 7 test table")
        errors += len(undefined_tests)
    if uncited_tests:
        for t in sorted(uncited_tests):
            print(f"WARNING: {t} in Section 7 but never cited elsewhere")
        warnings += len(uncited_tests)
    if not undefined_tests and not uncited_tests:
        print("PASS: All test ID citations resolve; all test IDs are cited")

    # 3. TOC sync — only flag TOC entries that reference non-existent headings.
    # The TOC is intentionally a partial listing; headings missing from TOC is expected.
    headings = extract_headings(text)
    toc_entries = extract_toc_entries(text)
    heading_texts_set = set(h[1] for h in headings)
    toc_set = set(toc_entries)
    missing_headings = sorted(toc_set - heading_texts_set)
    if missing_headings:
        for entry in missing_headings:
            print(f"ERROR: TOC entry '{entry}' not found in headings")
        errors += len(missing_headings)
    else:
        print("PASS: All TOC entries resolve to headings")

    # 4. Requirement block shape
    block_issues = check_req_blocks(text)
    if block_issues:
        for issue in block_issues:
            print(f"ERROR: {issue}")
        errors += len(block_issues)
    else:
        print("PASS: All requirement blocks follow canonical shape")

    # 5. Section separators
    sep_issues = check_separators(text)
    if sep_issues:
        for issue in sep_issues:
            print(f"WARNING: {issue}")
        warnings += len(sep_issues)
    else:
        print("PASS: All sections separated by ---")

    # Summary
    print(f"\n{errors} error(s), {warnings} warning(s)")
    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
