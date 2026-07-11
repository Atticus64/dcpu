import type * as monaco from 'monaco-editor'

const INSTRUCTIONS = [
  'MOV', 'PUSH', 'POP', 'XCHG', 'LEA',
  'ADD', 'SUB', 'MUL', 'IMUL', 'DIV', 'IDIV', 'INC', 'DEC', 'NEG', 'CMP',
  'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR', 'SAR', 'ROL', 'ROR',
  'JMP', 'JE', 'JNE', 'JZ', 'JNZ', 'JG', 'JL', 'JGE', 'JLE', 'JA', 'JB', 'JAE', 'JBE',
  'JEQ', 'JNEQ', 'JGT', 'JLT', 'JMP',
  'CALL', 'RET', 'RETF', 'IRET',
  'INT', 'STI', 'CLI', 'HLT', 'NOP',
  'LOOP', 'LOOPE', 'LOOPNE',
  'TEST', 'CMPXCHG', 'BSWAP',
  'SETE', 'SETNE', 'SETG', 'SETL', 'SETGE', 'SETLE',
  'CBW', 'CWD', 'CDQ', 'CWDE', 'CDQE',
  'MOVSB', 'MOVSW', 'MOVSD', 'STOSB', 'LODSB', 'SCASB', 'CMPSB',
  'REP', 'REPE', 'REPNE',
  'CPUID', 'RDTSC',
]

const REGISTERS = [
  'AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'SP', 'BP',
  'EAX', 'EBX', 'ECX', 'EDX', 'ESI', 'EDI', 'ESP', 'EBP',
  'RAX', 'RBX', 'RCX', 'RDX', 'RSI', 'RDI', 'RSP', 'RBP',
  'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
  'R8D', 'R9D', 'R10D', 'R11D', 'R12D', 'R13D', 'R14D', 'R15D',
  'R8W', 'R9W', 'R10W', 'R11W', 'R12W', 'R13W', 'R14W', 'R15W',
  'R8B', 'R9B', 'R10B', 'R11B', 'R12B', 'R13B', 'R14B', 'R15B',
  'AL', 'AH', 'BL', 'BH', 'CL', 'CH', 'DL', 'DH',
  'CS', 'DS', 'SS', 'ES', 'FS', 'GS',
  'CR0', 'CR2', 'CR3', 'CR4',
  'DR0', 'DR1', 'DR2', 'DR3',
  'ST0', 'ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7',
  'XMM0', 'XMM1', 'XMM2', 'XMM3', 'XMM4', 'XMM5', 'XMM6', 'XMM7',
  'MM0', 'MM1', 'MM2', 'MM3', 'MM4', 'MM5', 'MM6', 'MM7',
]

const DIRECTIVES = [
  'BITS', 'SECTION', 'GLOBAL', 'EXTERN', 'ALIGN', 'TIMES',
  'DB', 'DW', 'DD', 'DQ', 'DT', 'RESB', 'RESW', 'RESD', 'RESQ',
  'EQU', 'INCBIN', 'ORG',
  'PROC', 'ENDP', 'STRUC', 'ENDSTRUC', 'MACRO', 'ENDM',
  'IF', 'ELSE', 'ELIF', 'ENDIF',
  'SEGMENT', 'ENDS', 'ASSUME',
  'MODEL', 'STACK', 'DOSSEG',
  'END', 'STARTUP', 'EXITCODE',
]

const KEYWORDS = [...INSTRUCTIONS, ...REGISTERS, ...DIRECTIVES]
const keywordMap: Record<string, true> = {}
for (const k of KEYWORDS) keywordMap[k] = true

export function registerAssemblyLanguage(monaco: typeof import('monaco-editor')) {
  monaco.languages.register({ id: 'x86asm' })

  monaco.languages.setMonarchTokensProvider('x86asm', {
    defaultToken: '',
    tokenPostfix: '.x86asm',

    brackets: [
      { open: '[', close: ']', token: 'delimiter.square' },
      { open: '(', close: ')', token: 'delimiter.parenthesis' },
    ],

    keywords: KEYWORDS,

    tokenizer: {
      root: [
        [/;.*$/, 'comment'],

        [/[\s]+/, 'white'],

        [/[a-zA-Z_][\w]*:/, 'type'],

        [/[a-zA-Z_$][\w$]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        }],

        [/\$[a-zA-Z_][\w]*/, 'variable'],

        [/%%[a-zA-Z_][\w]*/, 'variable'],
        [/%[a-zA-Z_][\w]*/, 'variable'],

        [/[0-9]+\.[0-9]*([eE][-+]?[0-9]+)?[fd]?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/0[bB][01]+/, 'number.binary'],
        [/[0-9]+/, 'number'],

        [/'[^'\\]*(\\.[^'\\]*)*'/, 'string'],
        [/"[^"\\]*(\\.[^"\\]*)*"/, 'string'],

        [/[[\]()]/, '@brackets'],

        [/[+\-*/%&|^~!<>=]+/, 'operator'],
        [/[,:;]/, 'delimiter'],
        [/[.](?!\d)/, 'identifier'],
        [/\s+/, 'white'],
      ],
    },
  } as monaco.languages.IMonarchLanguage)
}
