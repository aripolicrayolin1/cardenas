"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ShieldCheck, 
  Bug, 
  FlaskConical, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { type PredictivePestAnalysisOutput } from "@/ai/flows/predictive-pest-analysis";

interface PestAnalysisResultProps {
  data: PredictivePestAnalysisOutput;
}

export function PestAnalysisResult({ data }: PestAnalysisResultProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'muy_alto': return 'bg-destructive text-white border-destructive';
      case 'alto': return 'bg-orange-500 text-white border-orange-600';
      case 'medio': return 'bg-yellow-500 text-black border-yellow-600';
      case 'bajo': return 'bg-green-500 text-white border-green-600';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getIcon = (risk: string) => {
    if (risk === 'muy_alto' || risk === 'alto') return <AlertTriangle className="h-5 w-5" />;
    return <ShieldCheck className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Idoneidad */}
      <Card className={`border-none shadow-xl relative overflow-hidden ${data.pestSuitability.isSuitable ? 'ring-2 ring-destructive/20' : 'ring-2 ring-primary/20'}`}>
        <div className={`absolute top-0 left-0 w-full h-1.5 ${data.pestSuitability.isSuitable ? 'bg-destructive' : 'bg-primary'}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                {getIcon(data.pestSuitability.overallRisk)}
                IDONEIDAD DEL ENTORNO
              </CardTitle>
              <CardDescription className="font-bold uppercase text-[10px] tracking-widest">
                VEREDICTO IA AGROTECH
              </CardDescription>
            </div>
            <Badge className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-tighter shadow-lg ${getRiskColor(data.pestSuitability.overallRisk)}`}>
              RIESGO: {data.pestSuitability.overallRisk.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium leading-relaxed italic text-foreground/80 border-l-4 border-primary/20 pl-4 py-1">
            "{data.pestSuitability.summary}"
          </p>
        </CardContent>
      </Card>

      {/* Plagas Potenciales */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 px-2">
            <Bug className="h-4 w-4" /> Amenazas Identificadas
          </h3>
          {data.potentialPests.map((pest, i) => (
            <Card key={i} className="glass-card border-none hover:shadow-md transition-all group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-black tracking-tight group-hover:text-primary transition-colors">
                    {pest.name}
                  </CardTitle>
                  <Badge variant="outline" className={`text-[9px] font-black uppercase ${pest.riskLevel === 'alto' ? 'text-destructive border-destructive/20' : 'text-primary border-primary/20'}`}>
                    {pest.riskLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  {pest.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recomendaciones Técnicas */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 px-2">
            <FlaskConical className="h-4 w-4" /> Protocolo de Actuación
          </h3>
          {data.recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/60 border border-white shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  rec.type === 'insecticida' ? 'bg-red-100 text-red-600' : 
                  rec.type === 'tratamiento_suelo' ? 'bg-orange-100 text-orange-600' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  {rec.type === 'insecticida' ? <AlertCircle className="h-4 w-4" /> : 
                   rec.type === 'tratamiento_suelo' ? <TrendingUp className="h-4 w-4" /> : 
                   <CheckCircle2 className="h-4 w-4" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {rec.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-bold text-foreground/90 leading-snug">
                {rec.details}
              </p>
              <div className="pt-2 border-t border-primary/5">
                <p className="text-[10px] italic text-primary/70 flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {rec.rationale}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
