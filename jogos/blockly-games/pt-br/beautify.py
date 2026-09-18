#!/usr/bin/env python3
import re
import sys

def beautify_js(content):
    """Desminifica JavaScript básico - adiciona quebras de linha e indentação"""
    
    # Adiciona quebra de linha após {, }, ;, :
    content = re.sub(r'([;}])\s*', r'\1\n', content)
    content = re.sub(r'([{])\s*', r'\1\n', content)
    
    # Adiciona espaços ao redor de operadores
    content = re.sub(r'([=+\-*/<>!&|])\s*', r' \1 ', content)
    
    # Remove espaços múltiplos
    content = re.sub(r' +', ' ', content)
    
    # Adiciona indentação
    lines = content.split('\n')
    formatted = []
    indent_level = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Reduz indentação para }, else, etc
        if line.startswith('}') or line.startswith('else'):
            indent_level = max(0, indent_level - 1)
        
        # Adiciona indentação
        formatted_line = '  ' * indent_level + line
        formatted.append(formatted_line)
        
        # Aumenta indentação para { depois desse caractere
        indent_level += line.count('{') - line.count('}')
    
    return '\n'.join(formatted)

# Lê o arquivo
input_file = r'c:\Users\felip\OneDrive\Documentos\Mestrado USP\Teste\blockly-games\pt-br\puzzle\generated\pt-br\compressed.js'
output_file = r'c:\Users\felip\OneDrive\Documentos\Mestrado USP\Teste\blockly-games\pt-br\puzzle\generated\pt-br\beautified.js'

print(f"Lendo {input_file}...")
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

print("Desminificando...")
beautified = beautify_js(content)

print(f"Escrevendo em {output_file}...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(beautified)

print("Concluído!")
print(f"Tamanho original: {len(content)} bytes")
print(f"Tamanho formatado: {len(beautified)} bytes")
