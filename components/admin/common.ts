import { CourtType } from '@/models/Court';

export const dayData: Array<{
  value: NonNullable<
    NonNullable<
      CourtType['reservationsInfo']['reservedTimes'][number]['days']
    >[number]
  >;
  label: string;
}> = [
  { value: 'MONDAY', label: 'Δευτέρα' },
  { value: 'TUESDAY', label: 'Τρίτη' },
  { value: 'WEDNESDAY', label: 'Τετάρτη' },
  { value: 'THURSDAY', label: 'Πέμπτη' },
  { value: 'FRIDAY', label: 'Παρασκευή' },
  { value: 'SATURDAY', label: 'Σάββατο' },
  { value: 'SUNDAY', label: 'Κυριακή' },
];

export const typeData: Array<{
  value: CourtType['reservationsInfo']['reservedTimes'][number]['type'];
  label: string;
}> = [
  { value: 'TRAINING', label: 'Προπόνηση' },
  { value: 'OTHER', label: 'Άλλο' },
];
