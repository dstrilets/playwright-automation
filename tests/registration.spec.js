import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const selectors = {
    name: '#signupName',
    lastName: '#signupLastName',
    email: '#signupEmail',
    password: '#signupPassword',
    repeatPassword: '#signupRepeatPassword'
};

const passwordError =
    'Password has to be from 8 to 15 characters long and contain at least one integer, one capital, and one small letter';

function generateEmail() {
    return `aqa-${randomUUID()}@test.com`;
}

function getValidData(overrides = {}) {
    return {
        name: 'Anna',
        lastName: 'Smith',
        email: generateEmail(),
        password: 'Test1234',
        repeatPassword: 'Test1234',
        ...overrides
    };
}

async function fillValidForm(page, overrides = {}) {
    const data = getValidData(overrides);

    await page.locator(selectors.name).fill(data.name);
    await page.locator(selectors.lastName).fill(data.lastName);
    await page.locator(selectors.email).fill(data.email);
    await page.locator(selectors.password).fill(data.password);
    await page.locator(selectors.repeatPassword)
        .fill(data.repeatPassword);

    return data;
}

async function verifyValidation(page, selector, value, error) {
    await fillValidForm(page);

    const field = page.locator(selector);

    await field.fill(value);
    await field.blur();

    await expect(field).toHaveClass(/is-invalid/);

    await expect(field).toHaveCSS(
        'border-color',
        'rgb(220, 53, 69)'
    );

    await expect(
        page.getByRole('button', {
            name: 'Register',
            exact: true
        })
    ).toBeDisabled();

    await expect(
        page.getByText(error, { exact: true })
    ).toBeVisible();
}

test.describe('Registration tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        await page.getByRole('button', {
            name: 'Sign up',
            exact: true
        }).click();

        await expect(
            page.getByRole('heading', {
                name: 'Registration',
                exact: true
            })
        ).toBeVisible();
    });

    // Positive registration scenario

    test('Should successfully register a new user', async ({ page }) => {
        await fillValidForm(page);

        const registerButton = page.getByRole('button', {
            name: 'Register',
            exact: true
        });

        await expect(registerButton).toBeEnabled();

        await registerButton.click();

        await expect(page).toHaveURL(/\/panel\/garage/);
    });

    // Register button validation

    test('Should disable Register button when all fields are empty', async ({ page }) => {
        await expect(
            page.getByRole('button', {
                name: 'Register',
                exact: true
            })
        ).toBeDisabled();
    });

    // Name validation

    const nameCases = [
        {
            title: 'Name is empty',
            value: '',
            error: 'Name is required'
        },
        {
            title: 'Name contains only one character',
            value: 'A',
            error: 'Name has to be from 2 to 20 characters long'
        },
        {
            title: 'Name contains more than 20 characters',
            value: 'A'.repeat(21),
            error: 'Name has to be from 2 to 20 characters long'
        },
        {
            title: 'Name contains numbers',
            value: 'Anna123',
            error: 'Name is invalid'
        },
        {
            title: 'Name contains Cyrillic characters',
            value: 'Анна',
            error: 'Name is invalid'
        },
        {
            title: 'Name contains special characters',
            value: 'Anna@',
            error: 'Name is invalid'
        }
    ];

    for (const scenario of nameCases) {
        test(`Should reject registration when ${scenario.title}`, async ({ page }) => {

            // Known bug:
            // Expected: "Name is required".
            // Actual: "Name required".
            test.fail(
                scenario.value === '',
                'Incorrect required Name validation message'
            );

            await verifyValidation(
                page,
                selectors.name,
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
            error: 'Last name is required'
        },
        {
            title: 'Last name contains only one character',
            value: 'S',
            error: 'Last name has to be from 2 to 20 characters long'
        },
        {
            title: 'Last name contains more than 20 characters',
            value: 'S'.repeat(21),
            error: 'Last name has to be from 2 to 20 characters long'
        },
        {
            title: 'Last name contains numbers',
            value: 'Smith123',
            error: 'Last name is invalid'
        },
        {
            title: 'Last name contains Cyrillic characters',
            value: 'Иванова',
            error: 'Last name is invalid'
        },
        {
            title: 'Last name contains special characters',
            value: 'Smith@',
            error: 'Last name is invalid'
        }
    ];

    for (const scenario of lastNameCases) {
        test(`Should reject registration when ${scenario.title}`, async ({ page }) => {

            // Known issue:
            // Required Last name validation message
            // does not match the documented requirements.
            test.fail(
                scenario.value === '',
                'Incorrect required Last name validation message'
            );

            await verifyValidation(
                page,
                selectors.lastName,
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
            error: 'Email required'
        },
        {
            title: 'Email does not contain @',
            value: 'aqa-test.com',
            error: 'Email is incorrect'
        },
        {
            title: 'Email does not contain a domain',
            value: 'aqa-test@',
            error: 'Email is incorrect'
        },
        {
            title: 'Email does not contain a local part',
            value: '@test.com',
            error: 'Email is incorrect'
        },
        {
            title: 'Email contains spaces',
            value: 'aqa test@test.com',
            error: 'Email is incorrect'
        }
    ];

    for (const scenario of emailCases) {
        test(`Should reject registration when ${scenario.title}`, async ({ page }) => {
            await verifyValidation(
                page,
                selectors.email,
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
            error: 'Password required'
        },
        {
            title: 'Password contains fewer than 8 characters',
            value: 'Test123',
            error: passwordError
        },
        {
            title: 'Password contains more than 15 characters',
            value: 'Test123456789012',
            error: passwordError
        },
        {
            title: 'Password does not contain an uppercase letter',
            value: 'test1234',
            error: passwordError
        },
        {
            title: 'Password does not contain a lowercase letter',
            value: 'TEST1234',
            error: passwordError
        },
        {
            title: 'Password does not contain a number',
            value: 'TestTest',
            error: passwordError
        }
    ];

    for (const scenario of passwordCases) {
        test(`Should reject registration when ${scenario.title}`, async ({ page }) => {
            await verifyValidation(
                page,
                selectors.password,
                scenario.value,
                scenario.error
            );
        });
    }

    // Re-enter password validation

    test('Should reject registration when Re-enter password is empty', async ({ page }) => {
        await verifyValidation(
            page,
            selectors.repeatPassword,
            '',
            'Re-enter password required'
        );
    });

    test('Should reject registration when passwords do not match', async ({ page }) => {
        await verifyValidation(
            page,
            selectors.repeatPassword,
            'Test5678',
            'Passwords do not match'
        );
    });

    // Trim validation

    test('Should accept name and last name with surrounding spaces', async ({ page }) => {

        // Known bug:
        // Expected: leading and trailing spaces are ignored.
        // Actual: Name and Last name are marked as invalid
        // and the Register button remains disabled.
        test.fail(true, 'Name and Last name trim validation bug');

        await fillValidForm(page, {
            name: ' Anna ',
            lastName: ' Smith '
        });

        await expect(
            page.getByRole('button', {
                name: 'Register',
                exact: true
            })
        ).toBeEnabled();
    });

    // Name and Last name boundary values

    test('Should accept name and last name at valid length boundaries', async ({ page }) => {
        await fillValidForm(page, {
            name: 'An',
            lastName: 'Sm'
        });

        const registerButton = page.getByRole('button', {
            name: 'Register',
            exact: true
        });

        await expect(registerButton).toBeEnabled();

        await page.locator(selectors.name)
            .fill('A'.repeat(20));

        await page.locator(selectors.lastName)
            .fill('S'.repeat(20));

        await page.locator(selectors.lastName).blur();

        await expect(registerButton).toBeEnabled();
    });

    // Password boundary values

    test('Should accept password at valid length boundaries', async ({ page }) => {
        await fillValidForm(page, {
            password: 'Test1234',
            repeatPassword: 'Test1234'
        });

        const registerButton = page.getByRole('button', {
            name: 'Register',
            exact: true
        });

        await expect(registerButton).toBeEnabled();

        const maxLengthPassword = 'Test12345678901';

        await page.locator(selectors.password)
            .fill(maxLengthPassword);

        await page.locator(selectors.repeatPassword)
            .fill(maxLengthPassword);

        await page.locator(selectors.repeatPassword).blur();

        await expect(registerButton).toBeEnabled();
    });
});