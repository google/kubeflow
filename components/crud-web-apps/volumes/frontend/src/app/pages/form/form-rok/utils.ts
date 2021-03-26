import { ValidatorFn, FormControl } from '@angular/forms';

export function rokStorageClassValidator(
  rokManagedClasses: string[],
): ValidatorFn {
  return (control: FormControl): { [key: string]: any } => {
    const currentClass = control.value;
    if (!rokManagedClasses.includes(currentClass)) {
      return { notRokClass: true };
    }

    return null;
  };
}
