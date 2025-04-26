import { Request, Response } from 'express';

interface TipCategory {
  category: string; 
  tips: string[];
}

const categorizedTips: TipCategory[] = [
  {
    category: 'Transport',
    tips: [
      'Bra jobba! Du kjørte 100 km med elbil (kun 4 kg CO₂e) - fortsett slik.',
      'Flott valg å ta toget 50 km (2,5 kg CO₂e) denne uken!',
      'Innenriksfly på 200 km ga 31,8 kg CO₂e - vurder tog fremfor fly for denne distansen når det er mulig.',
      'Samkjør med venner eller kolleger på korte bilturer for å redusere utslipp per person.',
    ]
  },
  {
    category: 'Energi',
    tips: [
      'Ditt strømforbruk på 200 kWh (40 kg CO₂e) er moderat - husk å slå helt av lys og apparater når de ikke er i bruk.',
      'Fjernvarme sto for 87,5 kg CO₂e - senk innetemperaturen med 1-2 °C og vurder tetting av vinduer/dører for mindre varmetap.',
      'Installer termostatventiler eller smart termostat for automatisk temperaturstyring når du er ute eller sover.',
    ]
  },
  {
    category: 'Mat og Forbruk',
    tips: [
      'Flott at du spiste kylling istedenfor biff - det ga kun 18 kg CO₂e mot 120 kg fra oksekjøtt.',
      'Oksekjøtt ga 120 kg CO₂e – prøv å erstatte én biffmiddag i uka med bønner, linser eller en plantebasert burger.',
      'Melk sto for 12,36 kg CO₂e – vurder havremelk eller soyamelk, som har under 20 % av utslippet per liter.',
      'Planlegg ukemenyer og frys ned overskuddsmat for å unngå matsvinn.',
    ]
  }
];

export function getTips(req: Request, res: Response): void {
    try {
        res.status(200).json(categorizedTips);
    } catch (error: any) {
        console.error('Error sending categorized tips', error);
        res.status(500).send({error: 'Internal Server Error', message: 'Could not retrieve tips.'});
    }
}
