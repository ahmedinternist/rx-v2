const medications = rawList.map((item: any) => {
    if (typeof item === 'string') {
      return {
        name: item,
        dosage: '',
        instructions: 'As directed by physician',
        duration: '',
        quantity: '',
      };
    }

    // Comprehensive check for drug name
    const name = toText(
      item?.name || 
      item?.drugName || 
      item?.tradeName || 
      item?.genericName || 
      item?.drug || 
      item?.medicine || 
      item?.item || 
      item?.title,
      'Prescribed Item'
    );

    // Comprehensive check for dosage / strength / form
    const dosage = toText(
      item?.dosage || 
      item?.dose || 
      item?.strength || 
      item?.form || 
      item?.concentration,
      ''
    );

    // Comprehensive check for directions / sig / frequency
    const instructions = toText(
      item?.instructions || 
      item?.sig || 
      item?.directions || 
      item?.frequency || 
      item?.frequencyText || 
      item?.regimen || 
      item?.instruction,
      'As directed by physician'
    );

    // Comprehensive check for duration
    const duration = toText(
      item?.duration || 
      item?.period || 
      item?.treatmentDays || 
      item?.days,
      ''
    );

    // Comprehensive check for quantity
    const quantity = toText(
      item?.quantity || 
      item?.qty || 
      item?.count || 
      item?.totalQuantity || 
      item?.packSize,
      ''
    );

    return { name, dosage, instructions, duration, quantity };
  });
