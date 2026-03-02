<script lang="ts">
	let {
		name = 'phone',
		value = $bindable(''),
		invalid = false,
		placeholder = '0912 345 678',
		controlClass = '',
		validClass = '',
		invalidClass = ''
	} = $props<{
		name?: string;
		value?: string;
		invalid?: boolean;
		placeholder?: string;
		controlClass?: string;
		validClass?: string;
		invalidClass?: string;
	}>();

	let phoneDisplayValue = $state('');

	function normalizeVietnamPhoneInput(input: string) {
		const digitsOnly = input.replace(/\D/g, '');
		if (!digitsOnly) return '';
		if (digitsOnly.startsWith('84')) return `0${digitsOnly.slice(2, 11)}`;
		if (digitsOnly.startsWith('0')) return digitsOnly.slice(0, 10);
		return digitsOnly.slice(0, 10);
	}

	function formatVietnamPhone(input: string) {
		const digitsOnly = input.replace(/\D/g, '').slice(0, 10);
		if (digitsOnly.length <= 4) return digitsOnly;
		if (digitsOnly.length <= 7) return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
		return `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
	}

	function onPhoneInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const normalized = normalizeVietnamPhoneInput(target.value);
		const formatted = formatVietnamPhone(normalized);
		value = normalized;
		phoneDisplayValue = formatted;
		target.value = formatted;
	}

	$effect(() => {
		const formatted = formatVietnamPhone(value ?? '');
		if (phoneDisplayValue !== formatted) {
			phoneDisplayValue = formatted;
		}
	});
</script>

<div
	class={`flex w-full items-center rounded-xl border-2 transition focus-within:ring-2 ${
		controlClass
	} ${invalid ? invalidClass : validClass}`}
>
	<span
		class={`inline-flex min-h-11 items-center gap-1 border-r px-3 py-2 text-sm font-medium text-slate-700 ${
			invalid ? 'border-red-400' : 'border-primary/70'
		}`}
		aria-hidden="true"
	>
		<span>🇻🇳</span>
		<span>+84</span>
	</span>
	<input
		{name}
		value={phoneDisplayValue}
		oninput={onPhoneInput}
		type="tel"
		inputmode="numeric"
		pattern="[0-9 ]*"
		class="input-unstyled w-full rounded-r-xl border-0 bg-transparent px-3 py-2 outline-none ring-0 focus:outline-none"
		{placeholder}
		required
	/>
</div>
