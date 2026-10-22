Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root='C:\AGI\worktrees\folio-office\lane10-sovereign-receipt-01a13460';$e=Join-Path $root 'evidence\lane10-sovereign-receipt-01a13460\round2';$app=Join-Path $root 'src\App.tsx';$python='C:\Users\Shris\AppData\Local\Programs\Python\Python313\python.exe';$slot='C:\AGI\ops\scripts\heavy_slot.py';$lane='codex-folio-round2-01a13460'
$bytes=[IO.File]::ReadAllBytes($app);$text=[IO.File]::ReadAllText($app);$sha=(Get-FileHash -LiteralPath $app -Algorithm SHA256).Hash.ToLowerInvariant();$held=$false
$mutants=[ordered]@{
 M8=@('const existing=seeds.map(seed=>before.find(file=>file.templateId===seed.templateId||(file.kind===seed.kind&&file.name===seed.name)));','const existing=seeds.map(seed=>before.find(file=>file.templateId===seed.templateId));')
 M10=@('makeFile(seed.kind,seed.name,seed.data,seed.templateId)','makeFile(seed.kind,seed.name,seed.data)')
 M11=@('=>{await writes.current;const before=latest.current;','=>{const before=latest.current;')
}
function Memory([string]$s){$m=[math]::Floor((Get-Counter '\Memory\Available MBytes').CounterSamples.CookedValue);if($m-lt2048){throw "MEMORY_FLOOR_${s}: $m"}}
function Restore([string]$s){[IO.File]::WriteAllBytes($app,$bytes);if((Get-FileHash -LiteralPath $app -Algorithm SHA256).Hash.ToLowerInvariant()-ne$sha){throw "RESTORE_${s}"}}
function Run([string]$n,[bool]$green){Memory $n;Push-Location $root;try{& node node_modules/vitest/vitest.mjs run src/App.four-in-one.test.tsx --maxWorkers=1 *> (Join-Path $e "$n.txt");$code=$LASTEXITCODE}finally{Pop-Location};if($green-and$code-ne0){throw "GREEN_${n}: $code"};if(-not$green-and$code-eq0){throw "SURVIVED_${n}"}}
try{
 Memory 'SLOT';& $python $slot acquire --lane $lane *> (Join-Path $e 'followup-mutants-slot.txt');if($LASTEXITCODE-ne0){throw'SLOT'};$held=$true;$env:VITEST_MAX_WORKERS='1'
 Run 'followup-green-1' $true
 foreach($entry in $mutants.GetEnumerator()){try{$from=$entry.Value[0];$to=$entry.Value[1];if(([regex]::Matches($text,[regex]::Escape($from))).Count-ne1){throw "SITE_$($entry.Key)"};[IO.File]::WriteAllText($app,$text.Replace($from,$to),[Text.UTF8Encoding]::new($false));Run "followup-mutant-$($entry.Key)" $false}finally{Restore $entry.Key}}
 Run 'followup-green-2' $true
}finally{Restore 'FINAL';if($held){& $python $slot release --lane $lane *>> (Join-Path $e 'followup-mutants-slot.txt')}}
