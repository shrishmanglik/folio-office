Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root='C:\AGI\worktrees\folio-office\lane10-sovereign-receipt-01a13460'
$evidence=Join-Path $root 'evidence\lane10-sovereign-receipt-01a13460\round2'
$app=Join-Path $root 'src\App.tsx'
$python='C:\Users\Shris\AppData\Local\Programs\Python\Python313\python.exe'
$slot='C:\AGI\ops\scripts\heavy_slot.py'
$lane='codex-folio-round2-01a13460'
$original=[IO.File]::ReadAllBytes($app)
$originalText=[IO.File]::ReadAllText($app)
$originalSha=(Get-FileHash -LiteralPath $app -Algorithm SHA256).Hash.ToLowerInvariant()
$m8='const existing=seeds.map(seed=>before.find(file=>file.templateId===seed.templateId||(file.kind===seed.kind&&file.name===seed.name)));'
$m8Bad='const existing=seeds.map(seed=>before.find(file=>file.templateId===seed.templateId));'
$m10='makeFile(seed.kind,seed.name,seed.data,seed.templateId)'
$m10Bad='makeFile(seed.kind,seed.name,seed.data)'
$held=$false
function Memory([string]$stage){$m=[math]::Floor((Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue);if($m-lt2048){throw "MEMORY_FLOOR_${stage}: $m"};$m}
function Run([string]$name,[bool]$pass,[bool]$both=$false){Memory $name|Out-Null;Push-Location $root;try{if($both){& node node_modules/vitest/vitest.mjs run src/App.four-in-one.test.tsx src/FolioSovereignCommandSuite.test.tsx --maxWorkers=1 *> (Join-Path $evidence "$name.txt")}else{& node node_modules/vitest/vitest.mjs run src/App.four-in-one.test.tsx --maxWorkers=1 *> (Join-Path $evidence "$name.txt")};$exit=$LASTEXITCODE}finally{Pop-Location};if($pass-and$exit-ne0){throw "GREEN_FAILED_${name}: $exit"};if(-not$pass-and$exit-eq0){throw "MUTANT_SURVIVED_${name}"}}
function Restore([string]$stage){[IO.File]::WriteAllBytes($app,$original);$sha=(Get-FileHash -LiteralPath $app -Algorithm SHA256).Hash.ToLowerInvariant();if($sha-ne$originalSha){throw "RESTORE_FAILED_${stage}"}}
try{
 Memory 'SLOT'|Out-Null;& $python $slot acquire --lane $lane *> (Join-Path $evidence 'mutants-slot.txt');if($LASTEXITCODE-ne0){throw'SLOT_REFUSED'};$held=$true
 $env:VITEST_MAX_WORKERS='1';Run 'green-2-vitest' $true $true
 try{if(([regex]::Matches($originalText,[regex]::Escape($m8))).Count-ne1){throw'M8_SITE_COUNT'};[IO.File]::WriteAllText($app,$originalText.Replace($m8,$m8Bad),[Text.UTF8Encoding]::new($false));Run 'mutant-M8' $false}finally{Restore 'M8'}
 try{if(([regex]::Matches($originalText,[regex]::Escape($m10))).Count-ne1){throw'M10_SITE_COUNT'};[IO.File]::WriteAllText($app,$originalText.Replace($m10,$m10Bad),[Text.UTF8Encoding]::new($false));Run 'mutant-M10' $false}finally{Restore 'M10'}
 Run 'green-final-app' $true
}finally{Restore 'FINAL';if($held){& $python $slot release --lane $lane *>> (Join-Path $evidence 'mutants-slot.txt')}}
