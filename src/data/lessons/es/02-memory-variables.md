---
title: "Memoria y Variables"
lesson: 2
---

# Memoria y Variables

Los registros son rápidos pero limitados — solo hay unos pocos. Para la mayoría de los programas necesitarás **memoria**: la RAM donde viven las variables.

## El Segmento de Datos

En modo IDEAL, las variables se declaran en `DATASEG`:

```asm
IDEAL
MODEL small
STACK 100h

DATASEG
    myVar   DB  42        ; Definir Byte (8 bits)
    myWord  DW  1000h     ; Definir Word (16 bits)
    myDWord DD  0AABBCCDDh ; Definir Doble Word (32 bits)

CODESEG
START:
    ; tu código aquí

    MOV AX, 4C00h
    INT 21h
END START
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
MOV DX, OFFSET myVar    ; Cargar la dirección de myVar en DX
; o equivalentemente:
LEA DX, [myVar]         ; Load Effective Address
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

## Puntos Clave

- Las variables viven en `DATASEG` usando `DB`, `DW`, `DD`
- Usa corchetes `[var]` para acceder a la memoria
- El tamaño del registro debe coincidir con el tamaño de la variable
- `OFFSET` / `LEA` obtiene la dirección de una variable
- El acceso a memoria es más lento que los registros — usa registros para valores temporales
