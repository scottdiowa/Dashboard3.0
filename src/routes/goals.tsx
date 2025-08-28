import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

const goalsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  target_value: z.coerce.number().min(0, 'Target value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  metric_source: z.string().optional(),
  metric_field: z.string().optional(),
})

type GoalsFormData = z.infer<typeof goalsSchema>

interface Goal {
  id: string
  title: string
  target_value: number
  unit: string
  status: 'OPEN' | 'DONE'
  metric_source?: string
  metric_field?: string
  store_id: string
  created_at: string
}

export function GoalsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [storeId, setStoreId] = useState<string | null>(null)

  const form = useForm<GoalsFormData>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      title: '',
      target_value: 0,
      unit: '',
      metric_source: '',
      metric_field: '',
    },
  })

  // Resolve store_id for current user
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) return
      const { data, error } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .maybeSingle()
      if (!active) return
      if (error) return
      setStoreId(data?.store_id ?? null)
    })()
    return () => { active = false }
  }, [])

  // Fetch goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals', storeId],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
    enabled: !!storeId,
  })

  // Insert mutation
  const insertMutation = useMutation({
    mutationFn: async (payload: GoalsFormData) => {
      if (!storeId) {
        throw new Error('No store is linked to your account. See Setup to link one.')
      }
      const { error } = await supabase.from('goals').insert({
        store_id: storeId,
        title: payload.title,
        target_value: payload.target_value,
        unit: payload.unit,
        metric_source: payload.metric_source,
        metric_field: payload.metric_field,
        status: 'OPEN',
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Goal created successfully.' })
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['goals', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' })
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Goal removed.' })
      queryClient.invalidateQueries({ queryKey: ['goals', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' })
    }
  })

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'OPEN' | 'DONE' }) => {
      const { error } = await supabase.from('goals').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', storeId] })
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
    }
  })

  const onSubmit = (data: GoalsFormData) => {
    insertMutation.mutate(data)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleToggleStatus = (id: string, currentStatus: 'OPEN' | 'DONE') => {
    const newStatus = currentStatus === 'OPEN' ? 'DONE' : 'OPEN'
    toggleStatusMutation.mutate({ id, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wendys-charcoal">Goals</h1>
          <p className="text-gray-600">Set and track your business goals</p>
        </div>
      </div>

      {/* Add Goal Form */}
      <div className="wendys-card">
        <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Add New Goal</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="e.g., Increase Net Sales"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_value">Target Value</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                {...form.register('target_value')}
                placeholder="e.g., 5000"
              />
              {form.formState.errors.target_value && (
                <p className="text-sm text-red-600">{form.formState.errors.target_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                {...form.register('unit')}
                placeholder="e.g., $, %, hours"
              />
              {form.formState.errors.unit && (
                <p className="text-sm text-red-600">{form.formState.errors.unit.message}</p>
              )}
            </div>
          </div>

          {!storeId && (
            <div className="text-sm text-red-600">
              Your account isn't linked to a store yet. Open Setup and link your user to a store, then try again.
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" className="wendys-button" disabled={insertMutation.isPending || !storeId}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </form>
      </div>

      {/* Goals List */}
      <div className="wendys-card">
        <h3 className="text-lg font-semibold text-wendys-charcoal mb-4">Your Goals</h3>
        {goals.length === 0 ? (
          <p className="text-gray-500">No goals yet. Add your first goal above!</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(goal.id, goal.status)}
                    className="h-8 w-8 p-0"
                  >
                    {goal.status === 'DONE' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <div>
                    <h4 className={`font-medium ${goal.status === 'DONE' ? 'line-through text-gray-500' : 'text-wendys-charcoal'}`}>
                      {goal.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Target: {goal.target_value} {goal.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    goal.status === 'OPEN' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {goal.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(goal.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/goals')({
  component: GoalsPage,
})
