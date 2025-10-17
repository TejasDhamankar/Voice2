export const SYSTEM_TOOLS = {
  END_CALL: {
    type: "system",
    name: "end_call",
    description: "End the call when the user says goodbye, shows they are not interested, or when the conversation naturally concludes or there is an inactivity for a long time. Use this when the user indicates they want to end the call or when appropriate."
  }
};

export function getDefaultSystemTools() {
  return [SYSTEM_TOOLS.END_CALL];
}

export function combineTools(userTools: string[] = [], systemTools: any[] = getDefaultSystemTools()) {
  // Convert user tools to the expected format if needed
  const formattedUserTools = userTools.map(tool => {
    if (typeof tool === 'string') {
      return { type: "user", name: tool };
    }
    return tool;
  });

  return [...systemTools, ...formattedUserTools];
}
