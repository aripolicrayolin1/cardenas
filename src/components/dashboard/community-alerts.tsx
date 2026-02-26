
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const alerts = [
  {
    id: 1,
    region: "Actopan",
    crop: "Cebada",
    problem: "Tizón Foliar Detectado",
    severity: "Alta",
    distance: "12km",
    date: "Hoy, 10:30 AM"
  },
  {
    id: 2,
    region: "Pachuca",
    crop: "Tomate",
    problem: "Mosca Blanca",
    severity: "Media",
    distance: "25km",
    date: "Ayer"
  },
  {
    id: 3,
    region: "Tula",
    crop: "Chile",
    problem: "Marchitez por Fusarium",
    severity: "Baja",
    distance: "40km",
    date: "Hace 2 días"
  }
];

export function CommunityAlerts() {
  return (
    <Card className="border-none shadow-md overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-primary text-primary-foreground py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Red Comunitaria Hidalgo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="divide-y">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {alert.region} • {alert.distance}
                </div>
                <Badge variant={alert.severity === 'Alta' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                  {alert.severity}
                </Badge>
              </div>
              <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                {alert.problem}
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Cultivo: {alert.crop}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {alert.date}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 group-hover:translate-x-1 transition-transform">
                  Ver mapa <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 bg-muted/20 border-t">
        <Button className="w-full font-semibold shadow-sm" size="sm">
          Reportar Brote Local
        </Button>
      </div>
    </Card>
  );
}
