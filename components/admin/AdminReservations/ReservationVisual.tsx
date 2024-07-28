import { Paper } from '@mantine/core';
import React from 'react';

import { ReservationDataType } from '@/models/Reservation';

export interface ReservationVisualProps {
  reservation: ReservationDataType;
  width: number | string;
}

const ReservationVisual = ({
  reservation: r,
  width,
}: ReservationVisualProps) => {
  return (
    <Paper
      p="xs"
      withBorder
      shadow="xs"
      w={width}
      pos="absolute"
      top={`${Number(r.datetime.substring(14, 16))}px`}
      radius="sm"
      bg="teal"
      h={`${r.duration}px`}
    >
      {r._id}
    </Paper>
  );
};
export default ReservationVisual;
