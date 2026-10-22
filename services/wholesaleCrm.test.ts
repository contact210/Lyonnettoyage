import { describe, expect, it } from 'vitest';
import {
  completeTask,
  conversionRate,
  convertLead,
  customerInsights,
  customersToReactivate,
  moveLead,
  nextTaskFor,
  pipelineSummary,
  quotesToChase,
  sourceStats,
  taskBuckets,
  weightedPipeline
} from './wholesaleCrm';
import {
  DEFAULT_WHOLESALE_SETTINGS,
  MOCK_CRM_TASKS,
  MOCK_LEADS,
  MOCK_WHOLESALE_CUSTOMERS,
  MOCK_WHOLESALE_ORDERS
} from '../constants';
import { LeadStage } from '../types';

const today = '2026-10-22';
const settings = DEFAULT_WHOLESALE_SETTINGS;
const lead = (id: string) => MOCK_LEADS.find(l => l.id === id)!;

describe('pipeline', () => {
  it('pondère le potentiel mensuel par la probabilité de chaque étape', () => {
    // 180×10 % + 650×20 % + 240×40 % + 420×60 % + 310×80 %
    expect(weightedPipeline(MOCK_LEADS)).toBe(744);
    const proposal = pipelineSummary(MOCK_LEADS).find(s => s.stage === LeadStage.PROPOSAL)!;
    expect(proposal).toEqual({ stage: LeadStage.PROPOSAL, count: 1, monthlyHT: 420, weightedHT: 252 });
  });

  it('calcule le taux de conversion sur les prospects clos', () => {
    expect(conversionRate(MOCK_LEADS)).toBe(50);
    expect(conversionRate([lead('lead-1')])).toBeNull();
  });

  it('donne les résultats par origine', () => {
    expect(sourceStats(MOCK_LEADS).find(s => s.source === 'Recommandation')).toEqual({ source: 'Recommandation', count: 2, won: 1, rate: 100 });
  });
});

describe('étapes du prospect', () => {
  it('change d’étape et date l’entrée dans l’étape', () => {
    const moved = moveLead(lead('lead-2'), LeadStage.MEETING, today);
    expect(moved.stage).toBe(LeadStage.MEETING);
    expect(moved.stageDate).toBe(today);
  });

  it('exige un motif de perte et réserve « Gagné » à la conversion', () => {
    expect(() => moveLead(lead('lead-2'), LeadStage.LOST, today)).toThrow('pourquoi');
    expect(moveLead(lead('lead-2'), LeadStage.LOST, today, ' Trop cher ').lostReason).toBe('Trop cher');
    expect(() => moveLead(lead('lead-2'), LeadStage.WON, today)).toThrow('Convertir');
    expect(() => moveLead(lead('lead-7'), LeadStage.NEW, today)).toThrow('déjà devenu client');
  });

  it('efface le motif de perte quand on rouvre le prospect', () => {
    expect(moveLead(lead('lead-6'), LeadStage.CONTACTED, today).lostReason).toBeUndefined();
  });
});

describe('conversion en client', () => {
  const details = { siret: '888 999 000 11122', tvaIntra: 'fr88888999000', discountRate: 5, paymentTermsDays: 30 };

  it('crée la fiche client avec les coordonnées du prospect', () => {
    const { lead: won, customer } = convertLead(lead('lead-3'), details, { customers: MOCK_WHOLESALE_CUSTOMERS, today });
    expect(won.stage).toBe(LeadStage.WON);
    expect(won.customerId).toBe(customer.id);
    expect(customer).toEqual(
      expect.objectContaining({
        companyName: 'Garage Auto Confluence',
        siret: '888 999 000 11122',
        tvaIntra: 'FR 88 888999000',
        contactName: 'Thomas Girard',
        discountRate: 5,
        paymentTermsDays: 30
      })
    );
  });

  it('refuse un SIRET invalide ou déjà client, et un prospect perdu', () => {
    const ctx = { customers: MOCK_WHOLESALE_CUSTOMERS, today };
    expect(() => convertLead(lead('lead-3'), { ...details, siret: '123' }, ctx)).toThrow('14 chiffres');
    expect(() => convertLead(lead('lead-3'), { ...details, siret: '11122233300014' }, ctx)).toThrow('existe déjà');
    expect(() => convertLead(lead('lead-6'), details, ctx)).toThrow('Rouvrez');
    expect(() => convertLead(lead('lead-3'), { ...details, paymentTermsDays: 90 }, ctx)).toThrow('60 jours');
  });
});

describe('tâches', () => {
  it('range les tâches ouvertes : en retard, aujourd’hui, 7 jours, plus tard', () => {
    const b = taskBuckets(MOCK_CRM_TASKS, today);
    expect(b.overdue.map(t => t.id)).toEqual(['task-2']);
    expect(b.today.map(t => t.id)).toEqual(['task-3']);
    expect(b.week.map(t => t.id)).toEqual(['task-4', 'task-5', 'task-6']);
    expect(b.later).toEqual([]);
  });

  it('trouve la prochaine tâche d’un prospect ou d’un client', () => {
    expect(nextTaskFor(MOCK_CRM_TASKS, { leadId: 'lead-2' })).toBeUndefined(); // seule tâche déjà faite
    expect(nextTaskFor(MOCK_CRM_TASKS, { customerId: 'cli-3' })!.id).toBe('task-6');
    expect(completeTask(MOCK_CRM_TASKS[1], today)).toEqual(expect.objectContaining({ done: true, doneDate: today }));
  });
});

describe('suivi des clients', () => {
  it('résume l’activité d’un client', () => {
    const i = customerInsights('cli-1', MOCK_WHOLESALE_ORDERS, settings, today);
    expect(i).toEqual(
      expect.objectContaining({
        orderCount: 1,
        lastOrder: '2026-10-05',
        revenueHT: 938.7,
        marginHT: 224.7,
        averageBasketHT: 938.7,
        daysSinceLast: 17,
        dueTTC: 1126.44,
        overdueTTC: 0,
        health: 'Actif'
      })
    );
  });

  it('passe « à relancer » puis « inactif » quand le client ne commande plus', () => {
    expect(customerInsights('cli-1', MOCK_WHOLESALE_ORDERS, settings, '2026-11-25').health).toBe('À relancer');
    expect(customerInsights('cli-1', MOCK_WHOLESALE_ORDERS, settings, '2026-11-25').overdueTTC).toBe(1126.44);
    expect(customerInsights('cli-1', MOCK_WHOLESALE_ORDERS, settings, '2027-01-10').health).toBe('Inactif');
    expect(customerInsights('cli-3', MOCK_WHOLESALE_ORDERS, settings, today)).toEqual(
      expect.objectContaining({ health: 'Sans commande', openQuotes: 1, orderCount: 0 })
    );
  });

  it('liste les clients à relancer, le plus ancien d’abord', () => {
    const list = customersToReactivate(MOCK_WHOLESALE_CUSTOMERS, MOCK_WHOLESALE_ORDERS, settings, '2026-12-20');
    expect(list.map(x => x.customer.id)).toEqual(['cli-1', 'cli-2']);
  });

  it('relance les devis sans réponse à J+3 puis J+7', () => {
    // Devis CMD-2026-0003 du 17/10
    expect(quotesToChase(MOCK_WHOLESALE_ORDERS, '2026-10-19')).toEqual([]);
    expect(quotesToChase(MOCK_WHOLESALE_ORDERS, '2026-10-20')[0]).toEqual(expect.objectContaining({ age: 3, level: 'J+3' }));
    expect(quotesToChase(MOCK_WHOLESALE_ORDERS, today)[0]).toEqual(expect.objectContaining({ age: 5, level: 'J+3' }));
    expect(quotesToChase(MOCK_WHOLESALE_ORDERS, '2026-10-24')[0].level).toBe('J+7');
  });
});
