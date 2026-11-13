#!/usr/bin/env python3
"""Runs the generated JVM arguments on the installed JVM (java -version).

Run after `node tests/check-browser.js` (it writes the argument sets).
Only combinations whose Java version matches the running JVM are executed,
so a CI matrix over Java 17 / 21 / 25 covers all of them.
Set MCOPT_ALL=1 to run every combination on the current JVM.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ARGS_FILE = os.path.join(tempfile.gettempdir(), "mcopt-args.json")
BAD = re.compile(r"error|unrecognized|warning|ignored|deprecated|obsolete|not supported|invalid|could not|must be", re.I)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=120)


def java_major():
    out = run(["java", "-version"]).stderr
    m = re.search(r'version "(\d+)(?:\.(\d+))?', out)
    if not m:
        sys.exit("could not detect the Java version")
    major = int(m.group(1))
    return int(m.group(2)) if major == 1 and m.group(2) else major


def is_graalvm():
    # OpenJDK also accepts the JVMCI flags but has no Graal compiler, so look for GraalVM itself
    return "graalvm" in (run(["java", "-version"]).stderr).lower()


def main():
    if not os.path.exists(ARGS_FILE):
        sys.exit(f"{ARGS_FILE} not found: run node tests/check-browser.js first")
    combos = json.load(open(ARGS_FILE))
    major = java_major()
    graal = is_graalvm()
    run_all = os.environ.get("MCOPT_ALL") == "1"
    problems, ran = [], 0
    for c in combos:
        jv = int(c["jv"])
        matches = (jv == 23 and major >= 23) or jv == major
        if not (matches or run_all):
            continue
        args = c["args"].strip()
        args = re.sub(r"-XX:SoftMaxHeapSize=\d+G", "-XX:SoftMaxHeapSize=1G", args)
        args = args.replace("-XX:+AlwaysPreTouch", "")
        if not graal:
            args = re.sub(r"-XX:\+UseJVMCICompiler|-XX:\+EagerJVMCI|-Dgraal\.\S+", "", args)
        res = run(["java", "-Xms2G", "-Xmx2G"] + args.split() + ["-version"])
        ran += 1
        bad = [l.strip() for l in (res.stderr + res.stdout).splitlines() if BAD.search(l)]
        if res.returncode != 0 or bad:
            problems.append(f"{c['os']}/{c['eng']}/java{c['jv']}/lp={int(c['lp'])}: rc={res.returncode} {' || '.join(bad[:2])[:200]}")
    if problems:
        print(f"validate-jvm: {len(problems)} problem(s) on Java {major}")
        for p in problems:
            print(" - " + p)
        sys.exit(1)
    print(f"validate-jvm: OK ({ran} argument sets on Java {major}{', Graal JIT flags kept' if graal else ', Graal flags stripped (not GraalVM)'})")


if __name__ == "__main__":
    main()
