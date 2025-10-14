import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Heart, TrendingUp, Clock } from "lucide-react"

const stats = [
  {
    title: "Toplam Kullanıcı",
    value: "2,543",
    change: "+12.5%",
    icon: Users,
  },
  {
    title: "Aktif İlgi Alanları",
    value: "156",
    change: "+8.2%",
    icon: Heart,
  },
  {
    title: "Günlük Aktivite",
    value: "1,234",
    change: "+23.1%",
    icon: TrendingUp,
  },
  {
    title: "Ortalama Süre",
    value: "15 dk",
    change: "+2.4%",
    icon: Clock,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-primary">{stat.change} son aydan</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
