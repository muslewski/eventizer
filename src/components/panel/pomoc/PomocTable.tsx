'use client'

import { HelpCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import type { HelpTicket } from '@/payload-types'

interface PomocTableProps {
  tickets: HelpTicket[]
}

export function PomocTable({ tickets }: PomocTableProps) {
  if (tickets.length === 0) {
    return (
      <Empty className="min-h-[50svh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HelpCircleIcon />
          </EmptyMedia>
          <EmptyTitle>Nie masz żadnych zgłoszeń</EmptyTitle>
          <EmptyDescription>
            Utwórz nowe zgłoszenie, jeśli potrzebujesz pomocy.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tytuł</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.title}</TableCell>
              <TableCell>
                {ticket.isSolved ? (
                  <Badge variant="secondary">Rozwiązane</Badge>
                ) : (
                  <Badge variant="default">Otwarte</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
