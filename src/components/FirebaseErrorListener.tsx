
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Escucha global de errores de permisos de Firestore.
 *
 * ⚠️ Alcance deliberado: solo `useCollection` (lecturas de Firestore —fincas,
 *    mercado, empleos, alertas) emite al `errorEmitter`. Las lecturas del
 *    Realtime Database (`use-sensores`, `use-historico`) manejan su error
 *    localmente y NO pasan por aquí, porque `/sensores` y `/historico` son
 *    públicos según `database.rules.json`: un fallo ahí es de red, no de
 *    permisos, y ya se refleja en el estado `conectado`/`error` de cada hook.
 *    Si en el futuro el RTDB se cierra por autenticación, habría que emitir
 *    también desde esos hooks para unificar el aviso.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Mostramos un toast para el usuario
      toast({
        variant: 'destructive',
        title: 'Error de Permisos',
        description: `No tienes permiso para ${error.context.operation} en ${error.context.path}.`,
      });
      
      // Sólo en desarrollo se relanza, para que aparezca en el overlay de Next
      // con el path y la operación que rechazó la regla.
      //
      // En producción NO: una excepción dentro del manejador de un EventEmitter
      // no la captura ningún error boundary y tumbaría la aplicación entera.
      // Un permiso denegado debe mostrar un aviso, no cerrar la app en mitad
      // del campo.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
