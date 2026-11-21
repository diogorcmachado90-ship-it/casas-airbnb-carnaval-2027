$ErrorActionPreference = 'Stop'

$repository = 'https://raw.githubusercontent.com/diogorcmachado90-ship-it/casas-airbnb-carnaval-2027/main'
$files = @(
    'server.js',
    'public/index.html',
    'LEIA-ME.md'
)
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ('casas-airbnb-update-' + [guid]::NewGuid().ToString('N'))

try {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'server.js')) -or
        -not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'public'))) {
        throw 'Coloque este atualizador na pasta do projeto, ao lado de server.js.'
    }

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    New-Item -ItemType Directory -Path $staging | Out-Null

    foreach ($file in $files) {
        $relativePath = $file.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $stagedFile = Join-Path $staging $relativePath
        $stagedDirectory = Split-Path -Parent $stagedFile
        New-Item -ItemType Directory -Path $stagedDirectory -Force | Out-Null
        $url = $repository + '/' + $file
        Write-Host ('Baixando ' + $file + '...')
        Invoke-WebRequest -Uri $url -OutFile $stagedFile -UseBasicParsing -TimeoutSec 30
        if (-not (Test-Path -LiteralPath $stagedFile) -or (Get-Item -LiteralPath $stagedFile).Length -eq 0) {
            throw ('O arquivo baixado está vazio: ' + $file)
        }
    }

    foreach ($file in $files) {
        $relativePath = $file.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $source = Join-Path $staging $relativePath
        $destination = Join-Path $PSScriptRoot $relativePath
        Move-Item -LiteralPath $source -Destination $destination -Force
    }

    Write-Host ''
    Write-Host 'Atualizacao concluida. Seus dados salvos nao foram alterados.' -ForegroundColor Green
}
catch {
    Write-Host ''
    Write-Host ('Nao foi possivel atualizar: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
finally {
    if (Test-Path -LiteralPath $staging) {
        Remove-Item -LiteralPath $staging -Recurse -Force
    }
}
