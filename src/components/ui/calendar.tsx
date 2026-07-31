"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type ChevronProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Envoltorio de react-day-picker con los estilos del proyecto.
 *
 * Migrado a la API v9. El archivo venía de la v8 y estaba roto en silencio:
 * `IconLeft`/`IconRight` ya no existen (las flechas no se renderizaban) y todas
 * las claves de `classNames` habían cambiado de nombre (`caption` → `month_caption`,
 * `table` → `month_grid`, `day_selected` → `selected`, …), así que el calendario
 * salía sin estilos. El tipo de `classNames` es laxo y no lo detectaba;
 * `ignoreBuildErrors: true` tapaba lo poco que sí se detectaba.
 */
export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-7",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1 absolute inset-x-1 top-1 justify-between z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground rounded-md",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        range_middle:
          "bg-accent [&>button]:bg-transparent [&>button]:text-accent-foreground rounded-none",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        // v9 unificó `IconLeft`/`IconRight` en un único `Chevron` que recibe la
        // orientación como propiedad.
        Chevron: ({ orientation, className, ...props }: ChevronProps) => {
          const Icono = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icono className={cn("h-4 w-4", className)} {...props} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
