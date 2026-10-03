import { Label, Pie, PieChart } from 'recharts'
import type { BetSummary } from '../types/race.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './ui/chart'

// Azul y naranja: se distinguen también con daltonismo (validado en modo claro y oscuro).
// No se usan verde y rojo porque esos colores se reservan para estados (aprobado / error).
const chartConfig = {
  count: { label: 'Apuestas' },
  won: { label: 'Ganadas', theme: { light: '#2a78d6', dark: '#3987e5' } },
  lost: { label: 'Perdidas', theme: { light: '#eb6834', dark: '#d95926' } },
} satisfies ChartConfig

export function BetsDonutChart({ bets }: { bets: BetSummary }) {
  const total = bets.won + bets.lost
  const data = [
    { result: 'won', count: bets.won, fill: 'var(--color-won)' },
    { result: 'lost', count: bets.lost, fill: 'var(--color-lost)' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Apuestas de hoy</h2>
        </CardTitle>
        <CardDescription>Una apuesta por carrera.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-64"
          role="img"
          aria-label={`Apuestas de hoy: ${bets.won} ganadas y ${bets.lost} perdidas de ${total}.`}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="result" hideLabel />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="result"
              innerRadius="58%"
              outerRadius="80%"
              stroke="var(--card)"
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox)) return null
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-semibold">
                        {bets.won}/{total}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground">
                        ganadas
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
            {/* itemSorter null: la leyenda respeta el orden de los datos (ganadas, perdidas), no el alfabético. */}
            <ChartLegend itemSorter={null} content={<ChartLegendContent nameKey="result" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
