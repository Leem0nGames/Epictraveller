'use client';

import React, { useEffect, useState } from 'react';
import { DeviceDetector } from '../Mobile/DeviceDetector';
import { VirtualJoystick } from './VirtualJoystick';
import { ActionButtons } from './ActionButtons';
import { EventBus } from '../Core/EventBus';

/**
 * Core Touch Overlay Wrapper.
 * Embeds joystick and button layouts dynamically based on touch detection states.
 */
export const TouchControls: React.FC = () => {
  const [shouldShow] = useState(() => {
    return DeviceDetector.isTouchDevice();
  });
  const [forceOnDesktop, setForceOnDesktop] = useState(false);

  useEffect(() => {
    // Allow debug forced toggle over the EventBus
    const eventBus = EventBus.getInstance();
    const handleToggle = (data: { force: boolean }) => {
      setForceOnDesktop(data.force);
    };

    eventBus.on('debug:touch:toggle', handleToggle);

    return () => {
      eventBus.off('debug:touch:toggle', handleToggle);
    };
  }, []);

  const activeVisibility = shouldShow || forceOnDesktop;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      {/* Joystick Zone on the left half */}
      <VirtualJoystick isVisible={activeVisibility} />

      {/* Primary and secondary Action Buttons on the right half */}
      <ActionButtons isVisible={activeVisibility} />
    </div>
  );
};
