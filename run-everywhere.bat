@echo off
for /D %%G in (".\glue-feature-*") DO (
    echo Processing %%G
    cd %%G
    call %~1
    cd ..
)