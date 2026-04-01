import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import { Input } from '../../app/components/ui/input';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import { useAuditLog } from '../../hooks/useAuditLog';
import { FilterX } from 'lucide-react';

export default function AuditLogSection() {
  const { events } = useAuditLog();

  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const uniqueActions = useMemo(() => {
    const actions = new Set(events.map(e => e.action));
    return Array.from(actions).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      let matches = true;
      if (actionFilter !== 'all' && e.action !== actionFilter) {
        matches = false;
      }
      
      const evtTime = new Date(e.timestamp).getTime();
      
      if (dateFrom) {
        // start of day
        const fromTime = new Date(dateFrom).getTime();
        if (evtTime < fromTime) matches = false;
      }
      if (dateTo) {
        // end of day
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        const toTime = toDate.getTime();
        if (evtTime > toTime) matches = false;
      }
      
      return matches;
    });
  }, [events, actionFilter, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Review system events and security-related actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-64">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground w-10">From</span>
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground w-6">To</span>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              disabled={actionFilter === 'all' && !dateFrom && !dateTo}
              className="gap-2"
            >
              <FilterX className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No audit events yet. Events appear as RBAC changes are made during this session.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{e.actorName}</div>
                        <div className="text-xs text-muted-foreground">{e.actorId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono font-medium text-[10px] tracking-tight">
                          {e.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{e.targetName}</div>
                        <div className="text-xs text-muted-foreground capitalize">{e.targetType}</div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate" title={e.detail}>
                        {e.detail}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
