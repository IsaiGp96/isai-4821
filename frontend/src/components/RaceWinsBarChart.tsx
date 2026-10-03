import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'
import { RACES_PER_DAY } from '../config/race'
import type { SnailWins } from '../types/race.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart'

const chartConfig = {
  wins: { label: 'Victorias', theme: { light: '#2a78d6', dark: '#3987e5' } },
} satisfies ChartConfig

// Barras horizontales: los nombres de los caracoles caben completos aun en pantallas angostas.
export function RaceWinsBarChart({ wins }: { wins: SnailWins[] }) {
  const data = wins.map((entry) => ({ name: entry.snail.name, wins: entry.wins }))
  const summary = data.map((entry) => `${entry.name} ${entry.wins}`).join(', ')

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Victorias del día</h2>
        </CardTitle>
        <CardDescription>
          {RACES_PER_DAY} carreras, un ganador por carrera.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
          role="img"
          aria-label={`Victorias del día: ${summary}.`}
        >
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} domain={[0, 'dataMax']} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
            {/* Recharts no dibuja barras en 0 ni su etiqueta: minPointSize reserva 1px y shape no pinta nada,
                así el "0" sigue visible sin simular una victoria. */}
            <Bar
              dataKey="wins"
              fill="var(--color-wins)"
              radius={[0, 4, 4, 0]}
              minPointSize={1}
              shape={(props: BarShapeProps) => (props.value === 0 ? <g /> : <Rectangle {...props} />)}
            >
              <LabelList dataKey="wins" position="right" className="fill-foreground" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
