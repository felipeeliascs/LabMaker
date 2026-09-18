
# Ler arquivo original
$inputFile = 'c:\Users\felip\OneDrive\Documentos\Mestrado USP\Teste\blockly-games\pt-br\puzzle\generated\pt-br\compressed.js'
$outputFile = 'c:\Users\felip\OneDrive\Documentos\Mestrado USP\Teste\blockly-games\pt-br\puzzle\generated\pt-br\decompressed.js'

$content = Get-Content -Path $inputFile -Raw

# Adicionar quebras de linha depois de ; } { 
$content = $content -replace '([;}])', "`$1`n"
$content = $content -replace '([{])', "`$1`n"

# Remover espaços em branco em excesso
$lines = $content -split "`n"
$formatted = @()
$indent = 0

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    
    if ([string]::IsNullOrEmpty($trimmed)) {
        continue
    }
    
    # Reduzir indentação para }
    if ($trimmed.StartsWith('}')) {
        $indent--
    }
    
    # Adicionar indentação
    $formatted += ('  ' * [Math]::Max(0, $indent)) + $trimmed
    
    # Aumentar indentação para {
    $indent += ($trimmed.Split('{').Count - 1)
    $indent -= ($trimmed.Split('}').Count - 1)
}

$result = $formatted -join "`n"
Set-Content -Path $outputFile -Value $result -Encoding UTF8

Write-Host "Arquivo desminificado criado: $outputFile"
Write-Host "Linhas: $(($result -split "`n").Count)"
