$ErrorActionPreference = 'Stop'
$source = 'src/App.tsx'
$utf8 = [Text.UTF8Encoding]::new($false)
$mutants = @(
  @{
    Name = 'G06-two-sided-no-barrier-corrected'
    Find = "setConflict(true);conflictBarrier.current=true;throw Error('Another editor"
    Replace = "setConflict(true);throw Error('Another editor"
  },
  @{
    Name = 'G07-recovery-leaves-barrier'
    Find = 'baseline.current=remote;acceptedSubmittedIntent.current=structuredClone(remote);conflictBarrier.current=false;persisted.current=JSON.stringify(remote);setConflict(false);'
    Replace = 'baseline.current=remote;acceptedSubmittedIntent.current=structuredClone(remote);persisted.current=JSON.stringify(remote);setConflict(false);'
  }
)
$original = [IO.File]::ReadAllBytes($source)
$hash = (Get-FileHash -Algorithm SHA256 $source).Hash
foreach ($mutant in $mutants) {
  $available = (Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue
  if ($available -lt 3000) { throw "PAUSED_RESOURCE before $($mutant.Name): $([math]::Round($available)) MB" }
  try {
    $text = $utf8.GetString($original)
    if (([regex]::Matches($text, [regex]::Escape($mutant.Find))).Count -ne 1) { throw "$($mutant.Name) target mismatch" }
    [IO.File]::WriteAllText($source, $text.Replace($mutant.Find, $mutant.Replace), $utf8)
    & npm.cmd exec vitest run src/App.four-in-one.test.tsx -- --maxWorkers=1 *> (Join-Path $PSScriptRoot "$($mutant.Name).log")
    if ($LASTEXITCODE -eq 0) { throw "$($mutant.Name) SURVIVED" }
  } finally {
    [IO.File]::WriteAllBytes($source, $original)
  }
  if ((Get-FileHash -Algorithm SHA256 $source).Hash -ne $hash) { throw "$($mutant.Name) restore mismatch" }
  "$($mutant.Name): KILLED; restored=$hash" | Tee-Object -FilePath (Join-Path $PSScriptRoot 'phase-b-mutant-results.txt') -Append
}
