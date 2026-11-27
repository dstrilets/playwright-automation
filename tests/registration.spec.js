import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/registrationPage.js';

const errors = {
    nameRequired: 'Name is required',
    nameInvalid: 'Name is invalid',
    nameLength: 'Name has to be from 2 to 20 characters long',

    lastNameRequired: 'Last name is required',
    lastNameInvalid: 'Last name is invalid',
    lastNameLength: 'Last name has to be from 2 to 20 characters long',

    emailRequired: 'Email required',
    emailInvalid: 'Email is incorrect',

    passwordRequired: 'Password required',
    passwordInvalid:
        'Password has to be from 8 to 15 characters long and contain at least one integer, one capital, and one small letter',

    repeatPasswordRequired: 'Re-enter password required',
    passwordMismatch: 'Passwords do not match'
};

test.describe('Registration tests', () => {
    let registrationPage;

    test.beforeEach(async ({ page }) => {
        registrationPage = new RegistrationPage(page);
        await registrationPage.open();
    });

    // Positive scenario

    test('Should successfully register a new user', async () => {
        await registrationPage.fillForm({
            name: 'An',
            lastName: 'A'.repeat(20)
        });

        await registrationPage.verifyRegisterEnabled();

        const response = await registrationPage.register();

        expect(response.ok()).toBeTruthy();

        await registrationPage.verifySuccessfulRegistration();
    });

    // Name validation

    const nameCases = [
        {
            title: 'Name is empty',
            value: '',
            error: errors.nameRequired,
            knownBug: true
        },
        {
            title: 'Name contains only one character',
            value: 'A',
            error: errors.nameLength
        },
        {
            title: 'Name contains more than 20 characters',
            value: 'A'.repeat(21),
            error: errors.nameLength
        },
        {
            title: 'Name contains numbers',
            value: 'Anna123',
            error: errors.nameInvalid
        },
        {
            title: 'Name contains Cyrillic characters',
            value: 'Анна',
            error: errors.nameInvalid
        },
        {
            title: 'Name contains special characters',
            value: 'Anna@',
            error: errors.nameInvalid
        }
    ];

    for (const scenario of nameCases) {
        test(`Should reject registration when ${scenario.title}`, async () => {

            // Known bug:
            // Expected: Name is required.
            // Actual: Name required.
            if (scenario.knownBug) {
                test.fail(true, 'Incorrect Name required error message');
            }

            await registrationPage.verifyValidation(
                registrationPage.nameInput,
                scenario.value,
                scenario.error
            );
        });
    }

    // Last name validation

    const lastNameCases = [
        {
            title: 'Last name is empty',
            value: '',
            error: errors.lastNameRequired,
            knownBug: true
        },
        {
            title: 'Last name contains only one character',
            value: 'S',
            error: errors.lastNameLength
        },
        {
            title: 'Last name contains more than 20 characters',
            value: 'S'.repeat(21),
            error: errors.lastNameLength
        },
        {
            title: 'Last name contains numbers',
            value: 'Smith123',
            error: errors.lastNameInvalid
        },
        {
            title: 'Last name contains Cyrillic characters',
            value: 'Иванова',
            error: errors.lastNameInvalid
        },
        {
            title: 'Last name contains special characters',
            value: 'Smith@',
            error: errors.lastNameInvalid
        }
    ];

    for (const scenario of lastNameCases) {
        test(`Should reject registration when ${scenario.title}`, async () => {

            // Known bug:
            // Expected: Last name is required.
            // Actual: Required error message differs from requirements.
            if (scenario.knownBug) {
                test.fail(true, 'Incorrect Last name required error message');
            }

            await registrationPage.verifyValidation(
                registrationPage.lastNameInput,
                scenario.value,
                scenario.error
            );
        });
    }

    // Email validation

    const emailCases = [
        {
            title: 'Email is empty',
            value: '',
            error: errors.emailRequired
        },
        {
            title: 'Email does not contain @',
            value: 'aqa-test.com',
            error: errors.emailInvalid
        },
        {
            title: 'Email does not contain a local part',
            value: '@test.com',
            error: errors.emailInvalid
        },
        {
            title: 'Email does not contain a domain',
            value: 'aqa-test@',
            error: errors.emailInvalid
        },
        {
            title: 'Email contains spaces',
            value: 'aqa test@test.com',
            error: errors.emailInvalid
        }
    ];

    for (const scenario of emailCases) {
        test(`Should reject registration when ${scenario.title}`, async () => {
            await registrationPage.verifyValidation(
                registrationPage.emailInput,
                scenario.value,
                scenario.error
            );
        });
    }

    // Password validation

    const passwordCases = [
        {
            title: 'Password is empty',
            value: '',
            error: errors.passwordRequired
        },
        {
            title: 'Password contains fewer than 8 characters',
            value: 'Test123',
            error: errors.passwordInvalid
        },
        {
            title: 'Password contains more than 15 characters',
            value: 'Test123456789012',
            error: errors.passwordInvalid
        },
        {
            title: 'Password does not contain uppercase letters',
            value: 'test1234',
            error: errors.passwordInvalid
        },
        {
            title: 'Password does not contain lowercase letters',
            value: 'TEST1234',
            error: errors.passwordInvalid
        },
        {
            title: 'Password does not contain numbers',
            value: 'TestTest',
            error: errors.passwordInvalid
        }
    ];

    for (const scenario of passwordCases) {
        test(`Should reject registration when ${scenario.title}`, async () => {
            await registrationPage.verifyValidation(
                registrationPage.passwordInput,
                scenario.value,
                scenario.error
            );
        });
    }

    // Repeat password validation

    test('Should reject registration when repeat password is empty', async () => {
        await registrationPage.verifyValidation(
            registrationPage.repeatPasswordInput,
            '',
            errors.repeatPasswordRequired
        );
    });

    test('Should reject registration when passwords do not match', async () => {
        await registrationPage.verifyValidation(
            registrationPage.repeatPasswordInput,
            'Test5678',
            errors.passwordMismatch
        );
    });

    // Register button validation

    test('Should disable Register button when all fields are empty', async () => {
        await registrationPage.verifyRegisterDisabled();
    });

    // Additional boundary and trim validation

    test('Should accept name and last name with surrounding spaces', async () => {

        // Known bug:
        // Expected: Surrounding spaces are ignored.
        // Actual: Name and Last name are invalid,
        // and the Register button is disabled.
        test.fail(true, 'Name and Last name are not trimmed');

        await registrationPage.fillForm({
            name: ' Anna ',
            lastName: ' Smith '
        });

        await registrationPage.verifyRegisterEnabled();
    });

    test('Should accept name and last name at valid length boundaries', async () => {
        await registrationPage.fillForm({
            name: 'A'.repeat(20),
            lastName: 'Sm'
        });

        await registrationPage.verifyRegisterEnabled();
    });

    test('Should accept password with exactly 15 characters', async () => {
        const password = 'Test12345678901';

        await registrationPage.fillForm({
            password,
            repeatPassword: password
        });

        await registrationPage.verifyRegisterEnabled();
    });
});