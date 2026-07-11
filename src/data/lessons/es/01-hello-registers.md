---
title: "¡Hola, Registros!"
lesson: 1
---

# ¡Hola, Registros!

¡Bienvenido a tu primera lección de assembly x86! Hoy aprenderemos sobre los **registros** — las variables internas de la CPU.

## En C: Variables

Cuando escribes `int a = 42;` en C, le estás pidiendo a la computadora que:

1. Reserve espacio en la memoria (RAM)
2. Lo etiquete como `a`
3. Almacene el valor `42` allí

```c
int a = 42;
int b = 7;
```

Esto es intuitivo — las variables viven en la memoria.

## En Assembly: Registros

Dentro de la propia CPU hay ubicaciones especiales de almacenamiento ultrarrápido llamadas **registros**. Son como variables construidas directamente en el procesador. A diferencia de la RAM, tienen nombres fijos:

| Registro | Nombre | Uso Común |
|----------|--------|-----------|
| **AX** | Acumulador | Aritmética, E/S |
| **BX** | Base | Dirección base |
| **CX** | Contador | Conteo de bucles |
| **DX** | Datos | E/S, multiplicación/división |

Para poner un valor en un registro, usa la instrucción **`MOV`**:

```asm
MOV AX, 42    ; Copia 42 en AX
MOV BX, 7     ; Copia 7 en BX
```

Piénsalo como una asignación en C:

```c
ax = 42;   // MOV AX, 42
bx = 7;    // MOV BX, 7
```

## Sintaxis Modo IDEAL

Turbo Assembler en **modo IDEAL** nos da una sintaxis limpia y estructurada:

```asm
IDEAL                    ; Habilita modo IDEAL
MODEL small              ; Modelo de memoria
STACK 100h               ; Tamaño de pila

DATASEG                  ; Segmento de datos
    ; las variables van aquí

CODESEG                  ; Segmento de código
START:                   ; Punto de entrada
    MOV AX, 42
    MOV BX, 7

    MOV AX, 4C00h        ; Función de salida
    INT 21h              ; Interrupción DOS
END START                ; Fin del programa
```

## Programa Equivalente en C

Aquí está la misma lógica en C:

```c
#include <stdio.h>

int main() {
    int ax = 42;    // como MOV AX, 42
    int bx = 7;     // como MOV BX, 7
    return 0;       // como MOV AX, 4C00h / INT 21h
}
```

## Conclusiones Clave

- Los **registros** son las variables internas de la CPU
- **`MOV`** copia un valor en un registro
- **AX** es el registro principal (acumulador)
- El modo IDEAL usa secciones claras: `DATASEG`, `CODESEG`
