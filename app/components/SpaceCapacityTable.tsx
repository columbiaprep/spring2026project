'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";

// Types for our space data
type CapacityStatus = "Empty" | "Somewhat busy" | "Very Busy";

interface SpaceData {
  id: number;
  name: string;
  status: CapacityStatus;
}

// Mock Data
const SPACES: SpaceData[] = [
  { id: 1, name: "Library", status: "Somewhat busy" },
  { id: 2, name: "Main Cafeteria", status: "Very Busy" },
  { id: 3, name: "South Gym", status: "Empty" },
  { id: 4, name: "Student Lounge", status: "Somewhat busy" },
  { id: 5, name: "Media Lab", status: "Empty" },
];

// Status Mappings (Color & Icons)
const statusConfig: Record<CapacityStatus, { color: "success" | "warning" | "danger"; icon: React.ReactNode }> = {
  Empty: {
    color: "success",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  "Somewhat busy": {
    color: "warning",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  "Very Busy": {
    color: "danger",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
};

export default function SpaceCapacityTable() {
  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">Space Capacity</h2>
        <p className="text-default-500 text-small">Check the current occupancy of school spaces before you go.</p>
      </div>

      <Table aria-label="School Space Capacity Table" selectionMode="none">
        <TableHeader>
          <TableColumn>SPACE NAME</TableColumn>
          <TableColumn align="center">CAPACITY DESCRIPTION</TableColumn>
          <TableColumn align="end">ICON</TableColumn>
        </TableHeader>
        <TableBody>
          {SPACES.map((space) => {
            const config = statusConfig[space.status];
            return (
              <TableRow key={space.id}>
                <TableCell className="font-medium">{space.name}</TableCell>
                <TableCell>
                  <Chip color={config.color} variant="flat" size="sm">
                    {space.status}
                  </Chip>
                </TableCell>
                <TableCell className="text-default-400">
                  <div className="flex justify-end pr-2">
                    {config.icon}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
