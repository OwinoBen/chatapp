from django import template

register = template.Library()


# Create name initials like gmail (Benson Ken(BK))
@register.filter(name='initials')
def initials(value):
    name_initials = ''

    for name in value.split(' '):
        if name and len(name_initials) < 3:
            name_initials += name[0].upper()
    return name_initials
