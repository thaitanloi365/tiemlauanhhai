'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
  useReactTable,
} from '@tanstack/react-table';
import { EmployeeForm } from '@/components/admin/employee-form';
import { Button } from '@/components/ui/button';

type Employee = {
  id: string;
  email: string;
  role: 'super_admin' | 'manager';
  display_name?: string | null;
  created_at: string;
};

const ROLE_OPTIONS: Array<{ value: Employee['role']; label: string }> = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'manager', label: 'Manager' },
];

function roleLabel(role: Employee['role']) {
  return role === 'super_admin' ? 'Super Admin' : 'Manager';
}

export default function AdminEmployeesPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const employeesQuery = useQuery({
    queryKey: ['admin', 'employees'],
    queryFn: async () => {
      const res = await fetch('/api/admin/employees');
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message ?? 'Không thể tải danh sách nhân viên');
      return (result.employees ?? []) as Employee[];
    },
    retry: false,
    staleTime: 30_000,
  });

  const data = employeesQuery.data ?? [];

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      { accessorKey: 'email', header: 'Email' },
      {
        id: 'display_name',
        header: 'Tên hiển thị',
        cell: ({ row }) => row.original.display_name || '-',
      },
      {
        accessorKey: 'role',
        header: 'Vai trò',
        cell: ({ row }) => (
          <span className="rounded-full bg-muted px-2 py-1 text-xs text-foreground">
            {roleLabel(row.original.role)}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày tạo',
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleString('vi-VN'),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormMode('edit');
                setSelectedEmployee(row.original);
                setShowForm(true);
              }}
            >
              Sửa
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={savingId === row.original.id}
              onClick={() => removeEmployee(row.original)}
            >
              {savingId === row.original.id ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        ),
      },
    ],
    [savingId],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  async function removeEmployee(employee: Employee) {
    if (!window.confirm(`Xóa nhân viên ${employee.email}?`)) return;
    setSavingId(employee.id);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage(result.message ?? 'Không thể xóa nhân viên');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container-shell space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Quản lý nhân viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách tài khoản admin và phân quyền vai trò.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setFormMode('create');
            setSelectedEmployee(null);
            setShowForm(true);
          }}
        >
          Thêm nhân viên
        </Button>
      </div>

      {message ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      ) : null}

      {employeesQuery.isPending ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : employeesQuery.isError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {employeesQuery.error.message}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/60 text-left">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-3 py-2 font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-20 px-3 text-center text-muted-foreground"
                    >
                      Chưa có nhân viên nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <EmployeeForm
        open={showForm}
        mode={formMode}
        employee={selectedEmployee}
        roleOptions={ROLE_OPTIONS}
        onClose={() => setShowForm(false)}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] })
        }
      />
    </div>
  );
}
