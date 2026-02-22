import os
from pathlib import Path
from datetime import datetime

# ==================== CONFIGURAÇÕES ====================
PROJECT_ROOT = "."
OUTPUT_FILE = "PROJECT_SNAPSHOT"          # Nome base (sem .md)
MAX_LINES_PER_FILE = 3000                # Máximo de linhas por arquivo no modo dividido

# Diretórios ignorados
IGNORE_DIRS = {
    '.git', '__pycache__', 'node_modules', 'venv', '.venv',
    'dist', 'build', 'env', '.idea', '.vscode', 'coverage', 'dev-dist'
}

# Arquivos específicos ignorados
IGNORE_SPECIFIC_FILES = {
    'package-lock.json', 'yarn.lock', 'poetry.lock', 'Pipfile.lock',
    'snapShotGen.py',
}

# Extensões de arquivos para incluir
INCLUDE_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx',
    '.html', '.css', '.scss', '.sass',
    '.json', '.yaml', '.yml', '.toml', '.ini', '.conf',
    '.md', '.txt',
    '.sh', '.bash',
    '.env.example', '.gitignore', '.dockerignore',
}

# Arquivos importantes mesmo sem extensão
INCLUDE_FILES_NO_EXT = {
    'Dockerfile', 'Makefile', 'Procfile', '.env.example',
    'requirements.txt', 'package.json', 'pyproject.toml'
}

# Mapeamento extensão → linguagem para syntax highlight
EXT_TO_LANG = {
    '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
    '.jsx': 'jsx', '.tsx': 'tsx', '.html': 'html',
    '.css': 'css', '.scss': 'scss', '.json': 'json',
    '.yaml': 'yaml', '.yml': 'yaml', '.md': 'markdown',
    '.sh': 'bash', '.bash': 'bash', '.toml': 'toml',
    '.ini': 'ini', '.txt': 'text',
}


# ==================== FUNÇÕES AUXILIARES ====================

def is_snapshot_file(name):
    """Verifica se o arquivo é um snapshot gerado por este script"""
    return name.startswith(OUTPUT_FILE) and name.endswith('.md')


def should_include_path(path):
    """Verifica se deve incluir o arquivo/diretório"""
    if any(ignored in path.parts for ignored in IGNORE_DIRS):
        return False
    if path.name.startswith('.') and path.name not in {'.gitignore', '.env.example'}:
        return False
    if path.name in IGNORE_SPECIFIC_FILES:
        return False
    if is_snapshot_file(path.name):
        return False
    return True


def should_include_file(file_path):
    """Verifica se deve incluir o conteúdo do arquivo"""
    if not should_include_path(file_path):
        return False
    if file_path.suffix in INCLUDE_EXTENSIONS:
        return True
    if file_path.name in INCLUDE_FILES_NO_EXT:
        return True
    return False


def generate_tree(directory, prefix=""):
    """Gera árvore de diretórios em texto"""
    try:
        contents = sorted(
            Path(directory).iterdir(),
            key=lambda x: (not x.is_dir(), x.name)
        )
    except PermissionError:
        return []

    contents = [item for item in contents if should_include_path(item)]
    tree_lines = []

    for i, item in enumerate(contents):
        is_last_item = i == len(contents) - 1
        connector = "└── " if is_last_item else "├── "
        tree_lines.append(f"{prefix}{connector}{item.name}")

        if item.is_dir():
            extension = "    " if is_last_item else "│   "
            tree_lines.extend(generate_tree(item, prefix + extension))

    return tree_lines


def get_file_content(file_path):
    """Lê conteúdo COMPLETO do arquivo (sem truncar)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        return "[Arquivo binário - não incluído]"
    except Exception as e:
        return f"[Erro ao ler arquivo: {e}]"


def count_lines(file_path):
    """Conta linhas do arquivo"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return len(f.readlines())
    except Exception:
        return 0


# ==================== CONSTRUTORES DE BLOCOS ====================

def build_header(root, stats, total_parts=None, part_number=None):
    """Gera o cabeçalho com estatísticas e árvore de diretórios"""
    lines = []

    if total_parts and total_parts > 1:
        lines.append(f"# Project Snapshot (Parte {part_number}/{total_parts})\n")
    else:
        lines.append("# Project Snapshot\n")

    lines.append(f"**Gerado em:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    lines.append(f"**Projeto:** `{root.name}`\n")
    lines.append("---\n")

    # Estatísticas
    lines.append("## 📊 Estatísticas\n")
    lines.append(f"- **Total de arquivos:** {stats['total_files']}")
    lines.append(f"- **Total de linhas:** {stats['total_lines']:,}\n")
    lines.append("### Por tipo de arquivo:\n")
    lines.append("| Tipo | Arquivos | Linhas |")
    lines.append("|------|----------|--------|")
    for ext, data in sorted(stats['by_extension'].items(), key=lambda x: -x[1]['lines']):
        lines.append(f"| `{ext}` | {data['files']} | {data['lines']:,} |")
    lines.append("")

    # Árvore
    lines.append("---\n")
    lines.append("## 📁 Estrutura de Diretórios\n")
    lines.append("```")
    lines.append(f"{root.name}/")
    lines.extend(generate_tree(root))
    lines.append("```\n")

    return '\n'.join(lines) + '\n'


def build_continuation_header(part_number, total_parts):
    """Gera cabeçalho simplificado para partes 2+"""
    lines = [
        f"# Project Snapshot (Parte {part_number}/{total_parts})\n",
        f"**Gerado em:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        "---\n",
        "## 📄 Conteúdo dos Arquivos (continuação)\n",
    ]
    return '\n'.join(lines) + '\n'


def build_file_block(file_path, relative_path):
    """Gera bloco markdown de um arquivo (atômico, nunca será cortado)"""
    lang = EXT_TO_LANG.get(file_path.suffix, '')
    content = get_file_content(file_path)

    block = f"### `{relative_path}`\n\n"
    block += f"```{lang}\n"
    block += content
    if not content.endswith('\n'):
        block += '\n'
    block += "```\n\n"
    return block


# ==================== MODOS DE ESCRITA ====================

def write_single_file(header, file_blocks, stats):
    """Escreve tudo em um único arquivo"""
    output_name = f"{OUTPUT_FILE}.md"

    with open(output_name, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write("---\n\n## 📄 Conteúdo dos Arquivos\n\n")
        for block in file_blocks:
            f.write(block)

    size_kb = os.path.getsize(output_name) / 1024
    total_lines = _count_file_lines(output_name)

    print(f"\n✅ Snapshot gerado com sucesso!")
    print(f"📊 {stats['total_files']} arquivos, {stats['total_lines']:,} linhas de código")
    print(f"💾 {output_name} ({total_lines} linhas, {size_kb:.1f} KB)")


def write_split_files(header, file_blocks, stats, root):
    """Distribui blocos em múltiplos arquivos respeitando MAX_LINES_PER_FILE"""

    # ---- Primeira passada: descobrir quantas partes serão ----
    section_intro = "---\n\n## 📄 Conteúdo dos Arquivos\n\n"
    first_prefix = header + section_intro
    first_prefix_lines = first_prefix.count('\n')

    parts = []          # lista de listas de índices de blocos
    current_lines = first_prefix_lines
    current_indices = []

    for idx, block in enumerate(file_blocks):
        block_lines = block.count('\n')

        # Se já tem conteúdo e estourou o limite → fecha parte
        if current_indices and current_lines + block_lines > MAX_LINES_PER_FILE:
            parts.append(current_indices)
            current_indices = []
            # Cabeçalho de continuação (estimativa)
            current_lines = 6  # linhas do cabeçalho de continuação

        current_indices.append(idx)
        current_lines += block_lines

    if current_indices:
        parts.append(current_indices)

    total_parts = len(parts)

    # ---- Segunda passada: escrever arquivos ----
    output_files = []

    for part_num, indices in enumerate(parts, start=1):
        if total_parts == 1:
            filename = f"{OUTPUT_FILE}.md"
        else:
            filename = f"{OUTPUT_FILE}_{part_num}.md"

        with open(filename, 'w', encoding='utf-8') as f:
            if part_num == 1:
                rebuilt_header = build_header(
                    root, stats,
                    total_parts=total_parts,
                    part_number=1
                )
                f.write(rebuilt_header)
                f.write("---\n\n## 📄 Conteúdo dos Arquivos\n\n")
            else:
                f.write(build_continuation_header(part_num, total_parts))

            for idx in indices:
                f.write(file_blocks[idx])

        output_files.append(filename)

    # ---- Resumo ----
    print(f"\n✅ Snapshot dividido em {total_parts} arquivo(s)!")
    print(f"📊 {stats['total_files']} arquivos, {stats['total_lines']:,} linhas de código\n")
    for of in output_files:
        size_kb = os.path.getsize(of) / 1024
        total_lines = _count_file_lines(of)
        print(f"  💾 {of}  →  {total_lines} linhas, {size_kb:.1f} KB")


def _count_file_lines(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)


# ==================== FUNÇÃO PRINCIPAL ====================

def generate_snapshot():
    root = Path(PROJECT_ROOT).resolve()
    print(f"🔍 Escaneando projeto em: {root}")

    # Coleta arquivos e estatísticas
    all_files = []
    stats = {'total_files': 0, 'total_lines': 0, 'by_extension': {}}

    for file_path in root.rglob('*'):
        if file_path.is_file() and should_include_file(file_path):
            all_files.append(file_path)
            stats['total_files'] += 1

            lines = count_lines(file_path)
            stats['total_lines'] += lines

            ext = file_path.suffix if file_path.suffix else f'[{file_path.name}]'
            stats['by_extension'].setdefault(ext, {'files': 0, 'lines': 0})
            stats['by_extension'][ext]['files'] += 1
            stats['by_extension'][ext]['lines'] += lines

    all_files.sort()

    if not all_files:
        print("⚠️  Nenhum arquivo encontrado para incluir no snapshot.")
        return

    # Pergunta ao usuário
    print(f"\n📦 {stats['total_files']} arquivos encontrados, {stats['total_lines']:,} linhas de código")
    print(f"\nComo deseja gerar o snapshot?")
    print(f"  1 → Arquivo único (sem limite de linhas)")
    print(f"  2 → Dividido em múltiplos arquivos (máx. {MAX_LINES_PER_FILE} linhas cada)")
    choice = input("\nEscolha (1/2): ").strip()
    split_mode = choice == '2'

    print(f"\n📝 Gerando snapshot...")

    # Constrói cabeçalho
    header = build_header(root, stats)

    # Constrói blocos de conteúdo (cada arquivo = 1 bloco atômico)
    file_blocks = []
    for file_path in all_files:
        relative_path = file_path.relative_to(root)
        file_blocks.append(build_file_block(file_path, relative_path))

    # Escreve
    if split_mode:
        write_split_files(header, file_blocks, stats, root)
    else:
        write_single_file(header, file_blocks, stats)


if __name__ == "__main__":
    generate_snapshot()
