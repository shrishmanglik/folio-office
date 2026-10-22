$ErrorActionPreference = 'Stop'

$source = 'src/App.tsx'
$evidence = $PSScriptRoot
$utf8 = [Text.UTF8Encoding]::new($false)
$mutants = @(
  @{
    Name = 'Q-accepted-save-candidate'
    Find = 'acceptedSubmittedIntent.current=structuredClone(candidate);const current='
    Replace = 'acceptedSubmittedIntent.current=structuredClone(saveCandidate);const current='
  },
  @{
    Name = 'G02-remove-barrier-check'
    Find = "if(conflictBarrier.current)throw Error('Resolve the existing workspace conflict before saving again.');"
    Replace = ''
  },
  @{
    Name = 'G05-engine-conflict-no-barrier'
    Find = "if(r.code==='REVISION_CONFLICT'){setConflict(true);conflictBarrier.current=true;}"
    Replace = "if(r.code==='REVISION_CONFLICT'){setConflict(true);}"
  },
  @{
    Name = 'G06-two-sided-no-barrier'
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
$originalHash = (Get-FileHash -Algorithm SHA256 $source).Hash
foreach ($mutant in $mutants) {
  $available = (Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue
  if ($available -lt 3000) { throw "PAUSED_RESOURCE before $($mutant.Name): $([math]::Round($available)) MB" }
  try {
    $text = $utf8.GetString($original)
    $count = ([regex]::Matches($text, [regex]::Escape($mutant.Find))).Count
    if ($count -ne 1) { throw "$($mutant.Name) expected one target, found $count" }
    [IO.File]::WriteAllText($source, $text.Replace($mutant.Find, $mutant.Replace), $utf8)
    & npm.cmd exec vitest run src/App.four-in-one.test.tsx -- --maxWorkers=1 *> (Join-Path $evidence "$($mutant.Name).log")
    if ($LASTEXITCODE -eq 0) { throw "$($mutant.Name) SURVIVED" }
  } finally {
    [IO.File]::WriteAllBytes($source, $original)
  }
  $restored = (Get-FileHash -Algorithm SHA256 $source).Hash
  if ($restored -ne $originalHash) { throw "$($mutant.Name) restoration hash mismatch" }
  "$($mutant.Name): KILLED; restored=$restored" | Tee-Object -FilePath (Join-Path $evidence 'phase-b-mutant-results.txt') -Append
}
