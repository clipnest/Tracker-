import React, { useState } from 'react';
import { SavingsGoal } from '../../db/database';
import { savingsService } from '../../db/savingsService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { getToday } from '../../utils/dateUtils';

interface SavingsFormProps {
  goal?: SavingsGoal;
  onClose: () => void;
}

const ICONS = ['🎯','📱','✈️','🏠','🚗','💍','🎓','🏖️','💰','🛍️','🎮','📷','⌚','🏋️','🎸','💊','🌱','🏡','🐕','🎁'];
const COLORS = ['#06b6d4','#8b5cf6','#6366f1','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#a855f7'];

export default function SavingsForm({ goal, onClose }: SavingsFormProps) {
  const { showSnackbar } = useSnackbar();
  const today = getToday();
  const defaultTargetDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

  const [name, setName] = useState(goal?.name || '');
  const [targetRupees, setTargetRupees] = useState(goal ? Math.floor(goal.targetAmount / 100).toString() : '');
  const [startDate, setStartDate] = useState(goal?.startDate || today);
  const [targetDate, setTargetDate] = useState(goal?.targetDate || defaultTargetDate);
  const [description, setDescription] = useState(goal?.description || '');
  const [icon, setIcon] = useState(goal?.icon || '🎯');
  const [color, setColor] = useState(goal?.color || COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    const amt = Number(targetRupees);
    if (!targetRupees || isNaN(amt) || amt <= 0) e.target = 'Enter a valid target amount';
    if (amt > 10000000) e.target = 'Amount too large (max ₹1,00,00,000)';
    if (!startDate) e.startDate = 'Start date required';
    if (!targetDate) e.targetDate = 'Target date required';
    if (targetDate && startDate && targetDate <= startDate) e.targetDate = 'Target date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const targetAmount = Math.round(Number(targetRupees) * 100); // to paise
      const now = new Date().toISOString();
      if (goal?.id) {
        await savingsService.updateGoal(goal.id, { name: name.trim(), targetAmount, startDate, targetDate, description, icon, color });
        showSnackbar('Goal updated', 'success');
      } else {
        await savingsService.createGoal({ name: name.trim(), targetAmount, currentBalance: 0, startDate, targetDate, description, icon, color, status: 'active', createdAt: now, updatedAt: now });
        showSnackbar('Savings goal created! 💰', 'success');
      }
      onClose();
    } catch {
      showSnackbar('Failed to save goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Icon</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 200 }}>
            {ICONS.map(em => (
              <button key={em} onClick={() => setIcon(em)} aria-label={em}
                style={{ fontSize: 18, padding: '3px 5px', borderRadius: 7, border: icon === em ? `2px solid ${color}` : '2px solid transparent', background: icon === em ? `${color}22` : 'transparent', cursor: 'pointer' }}>
                {em}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Color</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 140 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} aria-label={c}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }} />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preview</span>
          </div>
        </div>
      </div>

      <Input label="Goal Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., New Phone" error={errors.name} maxLength={60} />
      <Input label="Target Amount (₹)" type="number" value={targetRupees} onChange={e => setTargetRupees(e.target.value)} placeholder="e.g., 50000" min="1" error={errors.target} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} error={errors.startDate} />
        <Input label="Target Date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} error={errors.targetDate} />
      </div>

      <Input label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you saving for?" />

      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} style={{ flex: 2, background: color, color: '#fff' }}>
          {saving ? 'Saving...' : goal ? 'Save Changes' : 'Create Goal'}
        </Button>
      </div>
    </div>
  );
}
