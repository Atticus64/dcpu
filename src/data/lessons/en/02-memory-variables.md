---
title: "Memory & Variables"
lesson: 2
---

# Memory & Variables

Registers are fast but limited — there are only a handful of them. For most programs you'll need **memory**: the RAM where variables live.

## The Data Segment

In IDEAL mode, variables are declared in `DATASEG`:

```asm
IDEAL
MODEL small
STACK 100h

DATASEG
    myVar   DB  42        ; Define Byte (8 bits)
    myWord  DW  1000h     ; Define Word (16 bits)
    myDWord DD  0AABBCCDDh ; Define Double Word (32 bits)

CODESEG
START:
    ; your code here

    MOV AX, 4C00h
    INT 21h
END START
```

## Data Directives

| Directive | Size | C Equivalent |
|-----------|------|-------------|
| `DB` | 1 byte (8 bits) | `char` / `uint8_t` |
| `DW` | 2 bytes (16 bits) | `short` / `uint16_t` |
| `DD` | 4 bytes (32 bits) | `int` / `uint32_t` |
| `DQ` | 8 bytes (64 bits) | `long long` / `uint64_t` |

## Accessing Memory with MOV

To read or write a variable, use **`MOV`** with brackets:

```asm
MOV AL, [myVar]     ; Load byte from myVar into AL
MOV AX, [myWord]    ; Load word from myWord into AX
```

To write a value:

```asm
MOV [myVar], 10     ; Store 10 into myVar
```

**Important**: the size of the register must match the variable size:
- `DB` → 8-bit register (`AL`, `BH`, `CL`, ...)
- `DW` → 16-bit register (`AX`, `BX`, ...)

## Addresses with OFFSET and LEA

Sometimes you need the **address** of a variable, not its value:

```asm
MOV DX, OFFSET myVar    ; Load the address of myVar into DX
; or equivalently:
LEA DX, [myVar]         ; Load Effective Address
```

`OFFSET` is a compile-time operator. `LEA` is an instruction computed at runtime.

## C Equivalent

```c
char myVar = 42;                    // DB  42
short myWord = 0x1000;              // DW  1000h

char al = myVar;                    // MOV AL, [myVar]
myVar = 10;                         // MOV [myVar], 10

char* ptr = &myVar;                 // MOV DX, OFFSET myVar
```

## Multiple Variables

You can define several variables in order:

```asm
DATASEG
    count   DB  0
    sum     DW  0
    message DB  'H', 'e', 'l', 'l', 'o'

CODESEG
START:
    MOV [count], 5
    MOV AX, [sum]
    ADD AX, 10
    MOV [sum], AX
```

## Key Takeaways

- Variables live in `DATASEG` using `DB`, `DW`, `DD`
- Use brackets `[var]` to access memory
- Register size must match variable size
- `OFFSET` / `LEA` gets the address of a variable
- Memory access is slower than registers — use registers for temporary values
