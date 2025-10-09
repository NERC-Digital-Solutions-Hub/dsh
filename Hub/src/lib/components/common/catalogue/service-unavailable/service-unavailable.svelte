<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
</script>

<Alert.Root variant="destructive">
	<AlertCircleIcon />
	<Alert.Title>Catalogue Service is currently unavailable.</Alert.Title>
	<Alert.Description>Please try again later.</Alert.Description>
</Alert.Root>
