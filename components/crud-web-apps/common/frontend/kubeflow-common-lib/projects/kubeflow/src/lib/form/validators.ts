import {
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
  AbstractControl,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';

import { Observable, of, timer, of as observableOf } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { RokService } from '../services/rok/rok.service';

const dns1123LabelFmt = '[a-z0-9]([-a-z0-9]*[a-z0-9])?';

export interface IValidator {
  regex: string;
  help: string;
}

export const dns1123Validator: IValidator = {
  regex: '^' + dns1123LabelFmt + '(\\.' + dns1123LabelFmt + ')*' + '$',
  help:
    "Name must consist of lowercase alphanumeric characters or '-', and\"" +
    ' must start and end with an alphanumeric character',
};

// TODO(kimwnasptd): We only use this validator, do we need the others?
export const dns1035Validator: IValidator = {
  regex: '^[a-z]([-a-z0-9]*[a-z0-9])?$',
  help: 'commonProject.namespaceInput.namePattern',
};

export const volSizeValidator: IValidator = {
  regex: '^[0-9]+(E|Ei|P|Pi|T|Ti|G|Gi|M|Mi|K|Ki)?$',
  help:
    'Invalid volume size: Should be an integer, or integer followed ' +
    'by a valid unit',
};

export const memoryValidator: IValidator = {
  regex:
    '^[0-9]+(' +
    '(([.][0-9]+)(E|Ei|P|Pi|T|Ti|G|Gi|M|Mi|K|Ki))' +
    '|' +
    '(E|Ei|P|Pi|T|Ti|G|Gi|M|Mi|K|Ki)' +
    ')?$',
  help:
    'Invalid memory size: Should be an integer, or fixed-point integer' +
    ' followed by a valid unit',
};

export const cpuValidator: IValidator = {
  regex: '^[0-9]*(m|[.][0-9]+)?$',
  help:
    'Invalid cpu limit: Should be a fixed-point integer or an integer ' +
    "followed by 'm'",
};

export const DEBOUNCE_TIME = 500;

// Create an async validator that adds debounce time to synchronous validators
export function mergeAndDebounceValidators(
  syncValidators: ValidatorFn[],
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return timer(DEBOUNCE_TIME).pipe(
      switchMap(() => {
        // Run all synchronous validators and return their concatenated output
        let validationResult: ValidationErrors = {};
        for (const validator of syncValidators) {
          const res = validator(control);

          // No errors
          if (res === null) {
            continue;
          }

          validationResult = Object.assign({}, res, validationResult);
        }

        // Return the concatenated result from all the validators
        if (Object.keys(validationResult).length === 0) {
          return observableOf(null);
        }

        return observableOf(validationResult);
      }),
    );
  };
}

// Name Validators
export const MAX_NAME_LENGTH = 50;

export function getNameError(nameCtrl: AbstractControl, resource: string) {
  if (nameCtrl.hasError('existingName')) {
    return {
      key: 'commonProject.namespaceInput.nameAlreadyExists',
      params: { name: nameCtrl.value },
    };
  } else if (nameCtrl.hasError('pattern')) {
    // TODO: "pattern", is generic error, this might break in the future
    return { key: dns1035Validator.help, params: {} };
  } else if (nameCtrl.hasError('maxlength')) {
    return { key: 'commonProject.namespaceInput.nameTooLong', params: {} };
  } else {
    return {
      key: 'commonProject.namespaceInput.nameCannotBeEmpty',
      params: {},
    };
  }
}

export function getExistingNameValidator(names: Set<string>): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    return names.has(control.value) ? { existingName: true } : null;
  };
}

export function getNameSyncValidators() {
  return [Validators.required];
}

export function getNameAsyncValidators(
  existingNames = new Set<string>(),
  maxLength = MAX_NAME_LENGTH,
): AsyncValidatorFn[] {
  return [
    mergeAndDebounceValidators([
      Validators.pattern(dns1035Validator.regex),
      Validators.maxLength(maxLength),
      getExistingNameValidator(existingNames),
    ]),
  ];
}

// Rok
export function getRokUrlError(rokUrlCtrl: AbstractControl) {
  if (rokUrlCtrl.hasError('required')) {
    return 'Rok URL cannot be empty';
  }

  if (rokUrlCtrl.hasError('invalidRokUrl')) {
    return 'Not a valid Rok URL';
  }
}

export function rokUrlValidator(rok: RokService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const url = control.value;

    // Don't return error if the url is empty
    if (url.length === 0) {
      return of(null);
    }

    // Ensure a protocol is given
    // Don't fire while the user is writting
    return timer(DEBOUNCE_TIME).pipe(
      switchMap(() => {
        return rok.getObjectMetadata(url, false).pipe(
          map(resp => {
            return null;
          }),
          catchError((msg: string) => {
            return observableOf({ invalidRokUrl: true });
          }),
        );
      }),
    );
  };
}
