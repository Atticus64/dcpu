---
title: "Memoria y Variables"
lesson: 2
---

# Memoria y Variables

Los registros son rápidos pero limitados — solo hay unos pocos. Para la mayoría de los programas necesitarás **memoria**: la RAM donde viven las variables.

## El Segmento de Datos

En modo IDEAL, las variables se declaran en `DATASEG`:

```asm
ideal
model small
stack 100h

dataseg
    myVar   db  42        ; Definir Byte (8 bits)
    myWord  dw  1000h     ; Definir Word (16 bits)
    myDWord dd  0AABBCCDDh ; Definir Doble Word (32 bits)

codeseg
start:
    ; tu código aquí

    mov ax, 4c00h
    int 21h
end start
```

## Directivas de Datos

| Directiva | Tamaño | Equivalente en C |
|-----------|--------|-----------------|
| `DB` | 1 byte (8 bits) | `char` / `uint8_t` |
| `DW` | 2 bytes (16 bits) | `short` / `uint16_t` |
| `DD` | 4 bytes (32 bits) | `int` / `uint32_t` |
| `DQ` | 8 bytes (64 bits) | `long long` / `uint64_t` |

## Acceder a Memoria con MOV

Para leer o escribir una variable, usa **`MOV`** con corchetes:

```asm
MOV AL, [myVar]     ; Cargar byte desde myVar en AL
MOV AX, [myWord]    ; Cargar word desde myWord en AX
```

Para escribir un valor:

```asm
MOV [myVar], 10     ; Almacenar 10 en myVar
```

**Importante**: el tamaño del registro debe coincidir con el tamaño de la variable:
- `DB` → registro de 8 bits (`AL`, `BH`, `CL`, ...)
- `DW` → registro de 16 bits (`AX`, `BX`, ...)

## Direcciones con OFFSET y LEA

A veces necesitas la **dirección** de una variable, no su valor:

```asm
mov dx, offset myVar    ; Cargar la dirección de myVar en DX
; o equivalentemente:
lea dx, [myVar]         ; Load Effective Address
```

`OFFSET` es un operador de compilación. `LEA` es una instrucción ejecutada en tiempo real.

## Equivalente en C

```c
char myVar = 42;                    // DB  42
short myWord = 0x1000;              // DW  1000h

char al = myVar;                    // MOV AL, [myVar]
myVar = 10;                         // MOV [myVar], 10

char* ptr = &myVar;                 // MOV DX, OFFSET myVar
```

## Variables Múltiples

Puedes definir varias variables en orden:

```asm
dataseg
    count   db  0
    sum     dw  0
    message db  'H', 'e', 'l', 'l', 'o'

codeseg
start:
    mov [count], 5
    mov ax, [sum]
    add ax, 10
    mov [sum], ax
```

## Puntos Clave

- Las variables viven en `DATASEG` usando `DB`, `DW`, `DD`
- Usa corchetes `[var]` para acceder a la memoria
- El tamaño del registro debe coincidir con el tamaño de la variable
- `OFFSET` / `LEA` obtiene la dirección de una variable
- El acceso a memoria es más lento que los registros — usa registros para valores temporales
