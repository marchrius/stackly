"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";

interface Stats {
  collectionsCount: number;
  itemsCount: number;
  albumsCount: number;
  photosCount: number;
  wishlistsCount: number;
  wishesCount: number;
  tagsCount: number;
  loansCount: number;
}

export function StatisticsCharts({ stats }: { stats: Stats }) {
  const chartData = [
    { name: "Collezioni", value: stats.collectionsCount, color: "rgb(var(--chart-1))" },
    { name: "Oggetti", value: stats.itemsCount, color: "rgb(var(--chart-2))" },
    { name: "Album", value: stats.albumsCount, color: "rgb(var(--chart-3))" },
    { name: "Foto", value: stats.photosCount, color: "rgb(var(--chart-4))" },
    { name: "Wishlist", value: stats.wishlistsCount, color: "rgb(var(--chart-5))" },
    { name: "Desideri", value: stats.wishesCount, color: "rgb(var(--chart-6))" },
    { name: "Tag", value: stats.tagsCount, color: "rgb(var(--chart-7))" },
    { name: "Prestiti attivi", value: stats.loansCount, color: "rgb(var(--chart-8))" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {chartData.map((d) => (
          <Card key={d.name}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">{d.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" style={{ color: d.color }}>{d.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Panoramica</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
