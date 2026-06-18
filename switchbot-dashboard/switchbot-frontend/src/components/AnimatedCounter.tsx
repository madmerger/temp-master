import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import Typography, { type TypographyProps } from '@mui/material/Typography';

interface AnimatedCounterProps extends Omit<TypographyProps, 'children'> {
  value: number;
  decimals?: number;
  suffix?: string;
}

function AnimatedCounterInner({ value, decimals = 1, suffix = '' }: AnimatedCounterProps) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => v.toFixed(decimals) + suffix);
  const [text, setText] = useState(value.toFixed(decimals) + suffix);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(v));
    return unsub;
  }, [display]);

  return <span ref={ref}>{text}</span>;
}

export default function AnimatedCounter({
  value,
  decimals = 1,
  suffix = '',
  ...typoProps
}: AnimatedCounterProps) {
  return (
    <Typography component={motion.span} {...typoProps}>
      <AnimatedCounterInner value={value} decimals={decimals} suffix={suffix} />
    </Typography>
  );
}
