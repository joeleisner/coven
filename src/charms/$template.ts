export function $template(template: string): HTMLTemplateElement {
	const element = document.createElement('template');
	element.innerHTML = template;
	return element;
}
