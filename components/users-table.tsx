import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const users = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    status: "active",
    interests: 5,
    joinDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Ayşe Demir",
    email: "ayse@example.com",
    status: "active",
    interests: 8,
    joinDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    email: "mehmet@example.com",
    status: "inactive",
    interests: 3,
    joinDate: "2024-03-10",
  },
  {
    id: 4,
    name: "Fatma Şahin",
    email: "fatma@example.com",
    status: "active",
    interests: 12,
    joinDate: "2024-01-05",
  },
  {
    id: 5,
    name: "Ali Çelik",
    email: "ali@example.com",
    status: "active",
    interests: 6,
    joinDate: "2024-02-28",
  },
]

export function UsersTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Users</CardTitle>
        <CardDescription className="text-muted-foreground">List of users registered in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-foreground">User</TableHead>
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Interests</TableHead>
              <TableHead className="text-foreground">Join Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/.jpg?height=32&width=32&query=${user.name}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className={user.status === "active" ? "bg-primary text-primary-foreground" : ""}
                  >
                    {user.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">{user.interests}</TableCell>
                <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
