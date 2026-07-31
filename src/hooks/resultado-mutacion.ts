/**
 * @fileOverview Resultado de una mutación que puede fallar.
 *
 * Existe por un motivo concreto: React no aplica `setState` de forma síncrona,
 * así que leer un estado de error justo después de un `await` devuelve el valor
 * del render ANTERIOR, no el que la mutación acaba de escribir.
 *
 *   // Mal: `errorMutacion` todavía vale lo de antes
 *   const id = await crear(datos);
 *   if (!id) toast({ description: errorMutacion });
 *
 *   // Bien: el motivo viaja en el propio resultado
 *   const { valor, error } = await crear(datos);
 *   if (!valor) toast({ description: error });
 *
 * El síntoma de hacerlo mal es engañoso: la interfaz muestra siempre el mensaje
 * por defecto —o el del fallo anterior— y manda al usuario a corregir algo que
 * no está roto.
 */
export interface ResultadoMutacion<T> {
  /** El valor producido, o `null` si la operación falló. */
  valor: T | null;
  /** Motivo del fallo listo para mostrar, o `null` si salió bien. */
  error: string | null;
}
