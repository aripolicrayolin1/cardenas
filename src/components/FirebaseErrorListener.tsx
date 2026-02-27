
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

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
      
      // Lanzamos el error para que NextJS lo capture en el overlay de desarrollo
      // Esto ayuda al desarrollador a identificar qué regla de seguridad está fallando.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
