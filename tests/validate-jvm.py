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
JAVA_BIN = os.environ.get("JAVA_BIN", "java")
BAD = re.compile(r"error|unrecognized|warning|ignored|deprecated|obsolete|not supported|invalid|could not|must be", re.I)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=120)


def java_major():
    out = run([JAVA_BIN, "-version"]).stderr
    m = re.search(r'version "(\d+)(?:\.(\d+))?', out)
    if not m:
        sys.exit("could not detect the Java version")
    major = int(m.group(1))
    return int(m.group(2)) if major == 1 and m.group(2) else major


def is_graalvm():
    # OpenJDK also accepts the JVMCI flags but has no Graal compiler, so look for GraalVM itself
    return "graalvm" in (run([JAVA_BIN, "-version"]).stderr).lower()


def host_os():
    if sys.platform.startswith("linux"):
        return "linux"
    if sys.platform.startswith("win"):
        return "windows"
    if sys.platform == "darwin":
        return "macos"
    return sys.platform


def linux_thp_supported(is_zgc):
    """Check whether Linux transparent huge pages are enabled for the selected GC."""
    try:
        with open("/sys/kernel/mm/transparent_hugepage/enabled", encoding="utf-8") as fh:
            enabled = fh.read()
    except OSError:
        return False
    if "[never]" in enabled:
        return False
    if is_zgc:
        try:
            with open("/sys/kernel/mm/transparent_hugepage/shmem_enabled", encoding="utf-8") as fh:
                shmem = fh.read()
            if "[never]" in shmem or ("[advise]" not in shmem and "[always]" not in shmem):
                return False
        except OSError:
            pass
    return True


def main():
    if not os.path.exists(ARGS_FILE):
        sys.exit(f"{ARGS_FILE} not found: run node tests/check-browser.js first")
    combos = json.load(open(ARGS_FILE))
    major = java_major()
    graal = is_graalvm()
    current_os = host_os()
    run_all = os.environ.get("MCOPT_ALL") == "1"
    problems, ran = [], 0
    skipped_os, skipped_thp, skipped_graal_zgc = 0, 0, 0
    for c in combos:
        jv = int(c["jv"])
        is_zgc = c["eng"].endswith("_zgc")
        matches = (jv == 23 and major >= 23) or jv == major
        if not (matches or run_all):
            continue
        if c.get("lp"):
            if c.get("os") != current_os:
                skipped_os += 1
                continue
            if current_os == "linux" and not linux_thp_supported(is_zgc):
                skipped_thp += 1
                continue
        # ZGC targets OpenJDK/Temurin on Java 21; Oracle GraalVM 21 enables JVMCI by default and warns on ZGC
        if graal and major < 23 and is_zgc:
            skipped_graal_zgc += 1
            continue
        args = c["args"].strip()
        args = re.sub(r"-XX:SoftMaxHeapSize=\d+G", "-XX:SoftMaxHeapSize=1G", args)
        args = args.replace("-XX:+AlwaysPreTouch", "")
        if not graal:
            args = re.sub(r"-XX:\+UseJVMCICompiler|-XX:\+EagerJVMCI|-D(?:jdk\.)?graal\.\S+", "", args)
        res = run([JAVA_BIN, "-Xms2G", "-Xmx2G"] + args.split() + ["-version"])
        ran += 1
        bad = [l.strip() for l in (res.stderr + res.stdout).splitlines() if BAD.search(l)]
        if res.returncode != 0 or bad:
            problems.append(f"{c['os']}/{c['eng']}/java{c['jv']}/lp={int(c['lp'])}: rc={res.returncode} {' || '.join(bad[:2])[:200]}")
    if problems:
        print(f"validate-jvm: {len(problems)} problem(s) on Java {major}")
        for p in problems:
            print(" - " + p)
        sys.exit(1)
    skips = []
    if skipped_os:
        skips.append(f"{skipped_os} non-{current_os} large-pages set(s)")
    if skipped_thp:
        skips.append(f"{skipped_thp} unconfigured Linux THP set(s)")
    if skipped_graal_zgc:
        skips.append(f"{skipped_graal_zgc} ZGC set(s) on GraalVM <23")
    extra = f", skipped {'; '.join(skips)}" if skips else ""
    print(f"validate-jvm: OK ({ran} argument sets on Java {major}{', Graal JIT flags kept' if graal else ', Graal flags stripped (not GraalVM)'}{extra})")


if __name__ == "__main__":
    main()
