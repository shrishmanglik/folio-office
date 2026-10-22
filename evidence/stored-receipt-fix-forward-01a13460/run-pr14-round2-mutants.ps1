$ErrorActionPreference='Stop';$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$cases=@(
 @{id='P04';file='src/App.tsx';before="setSaved(hasUnsavedEdits?'Unsaved changes':window.office?";after='setSaved(window.office?'},
 @{id='P05';file='src/App.tsx';before='basedOn=structuredClone(submittedIntent.current)';after='basedOn=structuredClone(baseline.current)'},
 @{id='P09';file='src/App.tsx';before="if(!r.files)throw Error('Storage did not return the saved workspace.');stored=structuredClone(r.files);";after='stored=structuredClone(r.files??saveCandidate);'},
 @{id='MA10';file='src/App.tsx';before='templateBatchQueue.current.then(async()';after='Promise.resolve().then(async()'},
 @{id='MA13';file='src/App.tsx';before='Boolean(file)&&publishedIds.has(file.id)';after='Boolean(file)'},
 @{id='MW04';file='src/Workspace.tsx';before='p.onCreate(seed.kind,seed.name,seed.data,seed.templateId)';after='p.onCreate(seed.kind,seed.name,seed.data)'}
);$results=@()
foreach($case in $cases){$path=Join-Path $root $case.file;$bytes=[IO.File]::ReadAllBytes($path);$sha=(Get-FileHash -Algorithm SHA256 $path).Hash.ToLower();$text=[Text.Encoding]::UTF8.GetString($bytes);if(-not$text.Contains($case.before)){throw "$($case.id) pattern missing"};try{[IO.File]::WriteAllText($path,$text.Replace($case.before,$case.after),(New-Object Text.UTF8Encoding($false)));& npx.cmd vitest run src\App.four-in-one.test.tsx src\FolioSovereignCommandSuite.test.tsx --maxWorkers=1 *> (Join-Path $PSScriptRoot "pr14-mutant-$($case.id).txt");$results+=[pscustomobject]@{mutant=$case.id;exit=$LASTEXITCODE;killed=($LASTEXITCODE-ne0);sourceSha256=$sha}}finally{[IO.File]::WriteAllBytes($path,$bytes);if((Get-FileHash -Algorithm SHA256 $path).Hash.ToLower()-ne$sha){throw "$($case.id) restore failed"}}};$results|ConvertTo-Json|Set-Content (Join-Path $PSScriptRoot 'pr14-round2-mutants.json') -Encoding utf8;$results|Format-Table -AutoSize;if($results.Where({-not$_.killed}).Count){exit 1}
