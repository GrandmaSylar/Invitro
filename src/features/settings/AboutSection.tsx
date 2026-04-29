import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { GitCommit, Clock, User, Github } from 'lucide-react';
// @ts-ignore
import { version, changelog } from 'virtual:git-info';

export default function AboutSection() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            About & Version
          </CardTitle>
          <CardDescription>
            System version information and recent changelog
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-1 border-b pb-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Version</span>
            <span className="text-3xl font-bold font-mono">{version}</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-muted-foreground" />
              Recent Changelog
            </h3>
            
            <div className="rounded-md border bg-muted/5 border-border shadow-sm overflow-hidden">
              {changelog && changelog.length > 0 ? (
                <div className="divide-y divide-border">
                  {changelog.map((entry: any) => (
                    <div key={entry.hash} className="p-4 flex flex-col gap-2 hover:bg-muted/50 transition-colors bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-medium text-sm leading-snug">{entry.msg}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm bg-card">
                  No changelog available.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
